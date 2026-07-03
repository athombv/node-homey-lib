'use strict';

const fs = require('fs');
const path = require('path');

const EXTENSION_MIMES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const MAX_TOTAL_PAYLOAD = 20 * 1024 * 1024; // 20MB — OpenAI request-payload ceiling

function isUrl(source) {
  return /^https?:\/\//i.test(source);
}

function toDataUrl(filePath) {
  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).toLowerCase();
  const mime = EXTENSION_MIMES[ext];
  if (!mime) {
    throw new Error(`Unsupported image extension "${ext}" for ${resolved}. Supported: ${Object.keys(EXTENSION_MIMES).join(', ')}`);
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`Image not found: ${resolved}`);
  }
  const buf = fs.readFileSync(resolved);
  const base64 = buf.toString('base64');
  return { url: `data:${mime};base64,${base64}`, size: buf.length };
}

/**
 * Normalize an array of {label, source} images. `source` is either an http(s)
 * URL (passed through) or a local file path (read + base64 data-URL encoded).
 *
 * Throws if total local-image payload would exceed 20MB, since that's the
 * provider request-body ceiling.
 */
function normalizeImages(images = []) {
  let totalPayload = 0;
  const result = images.map((img) => {
    if (!img || typeof img.label !== 'string' || typeof img.source !== 'string') {
      throw new Error(`Invalid image: expected { label: string, source: string }, got ${JSON.stringify(img)}`);
    }
    if (isUrl(img.source)) {
      return { label: img.label, url: img.source };
    }
    const { url, size } = toDataUrl(img.source);
    totalPayload += size;
    return { label: img.label, url };
  });
  if (totalPayload > MAX_TOTAL_PAYLOAD) {
    throw new Error(`Total local-image payload ${(totalPayload / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_TOTAL_PAYLOAD / 1024 / 1024}MB provider limit. Reduce image count or size.`);
  }
  return result;
}

module.exports = { normalizeImages };
