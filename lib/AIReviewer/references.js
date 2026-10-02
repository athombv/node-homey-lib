'use strict';

const fs = require('fs');
const path = require('path');

const REFERENCE_DIR = path.join(__dirname, 'data', 'references');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

/**
 * Load bundled Homey/Athom brand reference images. Every `.png` / `.jpg` file
 * in `data/references/` becomes an image block labelled
 * `reference: <basename-without-extension>`.
 *
 * Returns an empty array if the directory is missing or empty — the review
 * still runs, the model just falls back to its own pattern recognition for
 * Homey-logo detection.
 *
 * @returns {Array<{label: string, source: string}>}
 */
function loadReferenceImages() {
  let entries;
  try {
    entries = fs.readdirSync(REFERENCE_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries
    .filter(name => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort()
    .map(name => ({
      label: `reference: ${path.basename(name, path.extname(name))}`,
      source: path.join(REFERENCE_DIR, name),
    }));
}

module.exports = { loadReferenceImages };
