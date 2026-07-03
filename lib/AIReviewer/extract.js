'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const child_process = require('child_process');

const execFile = promisify(child_process.execFile);
const mkdtempAsync = promisify(fs.mkdtemp);

const TEXT_EXTENSIONS = new Set([
  '.js', '.ts', '.mjs', '.cjs', '.jsx', '.tsx',
  '.json', '.md', '.txt', '.css', '.html', '.xml', '.yaml', '.yml',
  '.svg',
  '.env', '.gitignore', '.npmignore', '.eslintrc', '.prettierrc',
]);

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'dist', 'build', '.homeybuild']);

const MAX_FILE_SIZE = 100 * 1024; // 100KB per file

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

function collectFiles(rootDir) {
  const files = [];
  let totalSize = 0;
  let skippedCount = 0;

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);
      const relPosix = toPosixPath(relPath);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) {
          skippedCount++;
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const stat = fs.statSync(fullPath);

        if (stat.size > MAX_FILE_SIZE) {
          skippedCount++;
          continue;
        }

        if (TEXT_EXTENSIONS.has(ext) || ext === '' || entry.name.startsWith('.')) {
          // README.md is GitHub-facing and routinely contains markdown, URLs and
          // donation links — none of which are store-rejection triggers there.
          // The store-facing readme is README.txt; skip README.md so the reviewer
          // doesn't apply store-readme rules to it.
          if (/^readme\.md$/i.test(entry.name)) {
            skippedCount++;
            continue;
          }
          // SVG handling: include the app-level icon and the per-driver/widget icons,
          // but skip product-variant icon collections (e.g. drivers/*/assets/icons/*.svg)
          // which would balloon the prompt without adding review value.
          if (ext === '.svg') {
            const isAppIcon = relPosix === 'assets/icon.svg';
            const isDriverIcon = /^drivers\/[^/]+\/assets\/icon\.svg$/.test(relPosix);
            const isWidgetIcon = /^widgets\/[^/]+\/assets\/icon\.svg$/.test(relPosix);
            if (!isAppIcon && !isDriverIcon && !isWidgetIcon) {
              skippedCount++;
              continue;
            }
          }
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes('\0')) {
              skippedCount++;
              continue;
            }
            files.push({ path: relPosix, content });
            totalSize += stat.size;
          } catch {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }
    }
  };

  walk(rootDir);

  files.sort((a, b) => {
    const priority = p => {
      if (p === 'app.json') return 0;
      if (p === 'package.json') return 1;
      if (p.endsWith('app.json')) return 2;
      return 10;
    };
    return priority(a.path) - priority(b.path) || a.path.localeCompare(b.path);
  });

  return {
    files, totalSize, fileCount: files.length, skippedCount,
  };
}

async function extractArchive(archivePath) {
  const resolved = path.resolve(archivePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Archive not found: ${resolved}`);
  }

  const tmpDir = await mkdtempAsync(path.join(os.tmpdir(), 'homey-review-'));

  try {
    const { stdout } = await execFile('tar', ['-tzf', resolved]);
    const entries = stdout.split('\n').filter(Boolean);
    for (const entry of entries) {
      const norm = path.posix.normalize(entry);
      if (norm === '..' || norm.startsWith('../') || norm.includes('/../') || norm.startsWith('/') || norm.includes('\0')) {
        throw new Error(`Unsafe path in archive: ${entry}`);
      }
    }

    await execFile('tar', ['-xzf', resolved, '-C', tmpDir]);
    return collectFiles(tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function extractDirectory(appPath) {
  const resolved = path.resolve(appPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory not found: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${resolved}`);
  }
  return collectFiles(resolved);
}

function formatAppSource(extracted) {
  let output = `# App Source Code (${extracted.fileCount} files, ${(extracted.totalSize / 1024).toFixed(1)}KB)\n\n`;

  if (extracted.skippedCount > 0) {
    output += `_${extracted.skippedCount} files skipped (binary, node_modules, or too large)_\n\n`;
  }

  for (const file of extracted.files) {
    const ext = path.extname(file.path).replace('.', '') || 'text';
    output += `## ${file.path}\n\`\`\`${ext}\n${file.content}\n\`\`\`\n\n`;
  }

  return output;
}

function summarizeExtracted(extracted, { topN = 15 } = {}) {
  const byFile = extracted.files
    .map(f => ({ path: f.path, chars: f.content.length }))
    .sort((a, b) => b.chars - a.chars)
    .slice(0, topN);
  const total = extracted.files.reduce((sum, f) => sum + f.content.length, 0);
  return { topFiles: byFile, totalChars: total, fileCount: extracted.fileCount };
}

module.exports = {
  extractArchive, extractDirectory, formatAppSource, summarizeExtracted,
};
