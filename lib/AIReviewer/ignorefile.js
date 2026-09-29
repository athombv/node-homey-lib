'use strict';

const fs = require('fs');
const path = require('path');

// `.homeyignore` decides what `homey app publish` actually ships, so honouring
// it keeps a local review aligned with what a submission would contain.
// `.gitignore` is the broader net: whatever a developer keeps out of version
// control is not something to hand to a model either.
const IGNORE_FILES = ['.homeyignore', '.gitignore'];

// A deliberately small subset of the gitignore spec: comments, negation,
// directory-only rules, anchoring, `*`, `?` and `**`. Nested ignore files are
// not read. Over-matching only costs a little review coverage; under-matching
// falls through to the credential denylist and the redaction pass.
function compileRule(line) {
  let pattern = line.trim();
  if (!pattern || pattern.startsWith('#')) return null;

  let negated = false;
  if (pattern.startsWith('!')) {
    negated = true;
    pattern = pattern.slice(1);
  }

  let dirOnly = false;
  if (pattern.endsWith('/')) {
    dirOnly = true;
    pattern = pattern.slice(0, -1);
  }

  const anchored = pattern.startsWith('/') || pattern.slice(0, -1).includes('/');
  if (pattern.startsWith('/')) pattern = pattern.slice(1);
  if (!pattern) return null;

  const segments = pattern.split('/');
  const body = segments
    .map((segment, i) => {
      const last = i === segments.length - 1;
      // `**/` may match zero directories, so it swallows its own separator.
      if (segment === '**') return last ? '.*' : '(?:.*/)?';
      return segment
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]') + (last ? '' : '/');
    })
    .join('');

  const prefix = anchored ? '^' : '^(?:.*/)?';
  const suffix = dirOnly ? '/.+$' : '(?:/.+)?$';

  return { re: new RegExp(`${prefix}${body}${suffix}`), negated };
}

/**
 * @param {string} rootDir
 * @returns {(relPosixPath: string) => boolean}
 */
function createIgnoreFilter(rootDir) {
  // One rule set per file: a negation in one file must not re-include what
  // the other excludes.
  const ruleSets = [];

  for (const file of IGNORE_FILES) {
    let content;
    try {
      content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
    } catch {
      continue;
    }
    const rules = content.split(/\r?\n/).map(compileRule).filter(Boolean);
    if (rules.length > 0) ruleSets.push(rules);
  }

  if (ruleSets.length === 0) return () => false;

  const isIgnoredBy = (rules, relPosixPath) => {
    let ignored = false;
    for (const rule of rules) {
      if (rule.re.test(relPosixPath)) ignored = !rule.negated;
    }
    return ignored;
  };

  return relPosixPath => ruleSets.some(rules => isIgnoredBy(rules, relPosixPath));
}

module.exports = { createIgnoreFilter };
