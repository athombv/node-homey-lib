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

// Per-image and total ceilings, set to the stricter of what our providers accept:
//   - Anthropic caps base64 images at ~5MB per image.
//   - OpenAI caps request payload at ~20MB total.
// Enforcing both up-front produces a clear error before the provider rejects
// the call.
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_PAYLOAD = 20 * 1024 * 1024;

function isUrl(source) {
  return /^https?:\/\//i.test(source);
}

function toDataUrl(filePath, label) {
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
  if (buf.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image "${label}" (${resolved}) is ${(buf.length / 1024 / 1024).toFixed(1)}MB, exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB per-image limit. Downscale before submitting.`);
  }
  const base64 = buf.toString('base64');
  return { url: `data:${mime};base64,${base64}`, size: buf.length };
}

/**
 * Normalize an array of {label, source} images. `source` is either an http(s)
 * URL (passed through) or a local file path (read + base64 data-URL encoded).
 *
 * Throws if any individual local image exceeds MAX_IMAGE_SIZE (per-image
 * provider limit) or if the total local-image payload exceeds
 * MAX_TOTAL_PAYLOAD (request-body provider limit).
 */
function normalizeImages(images = []) {
  let totalPayload = 0;
  const result = images.map(img => {
    if (!img || typeof img.label !== 'string' || typeof img.source !== 'string') {
      throw new Error(`Invalid image: expected { label: string, source: string }, got ${JSON.stringify(img)}`);
    }
    if (isUrl(img.source)) {
      return { label: img.label, url: img.source };
    }
    const { url, size } = toDataUrl(img.source, img.label);
    totalPayload += size;
    return { label: img.label, url };
  });
  if (totalPayload > MAX_TOTAL_PAYLOAD) {
    throw new Error(`Total local-image payload ${(totalPayload / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_TOTAL_PAYLOAD / 1024 / 1024}MB provider limit. Reduce image count or size.`);
  }
  return result;
}

module.exports = { normalizeImages };
