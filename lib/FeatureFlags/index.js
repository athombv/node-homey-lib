'use strict';

const registry = require('./registry.json');

const ENCODING_VERSION = 1;
const MAX_BYTES = 1024;
const MAX_BIT = MAX_BYTES * 8 - 1;
const MAX_ENCODED_LENGTH = Math.ceil((MAX_BYTES * 4) / 3);
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Assignments are permanent, including released and abandoned features. Publish an
// appended registry before deploying code or MongoDB rules that use its new bits.
const HomeyFeature = Object.freeze(
  Object.fromEntries(Object.entries(registry).map(([name, { key }]) => [name, key])),
);
const FEATURE_BITS = Object.freeze(
  Object.fromEntries(Object.values(registry).map(({ key, bit }) => [key, bit])),
);

function encode(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > MAX_BYTES) {
    throw new TypeError('Invalid Homey feature bytes');
  }
  let { length } = bytes;
  while (length > 0 && bytes[length - 1] === 0) length -= 1;
  if (length === 0) return 'AA';

  let result = '';
  for (let index = 0; index < length; index += 3) {
    const value = (bytes[index] << 16) | ((bytes[index + 1] || 0) << 8) | (bytes[index + 2] || 0);
    result += ALPHABET[(value >>> 18) & 63] + ALPHABET[(value >>> 12) & 63];
    if (index + 1 < length) result += ALPHABET[(value >>> 6) & 63];
    if (index + 2 < length) result += ALPHABET[value & 63];
  }
  return result;
}

function decode(value) {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > MAX_ENCODED_LENGTH
    || value.length % 4 === 1
    || !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new TypeError('Invalid Homey feature flags');
  }
  const bytes = new Uint8Array(Math.floor((value.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (const character of value) {
    buffer = (buffer << 6) | ALPHABET.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset++] = (buffer >>> bits) & 255;
      buffer &= (1 << bits) - 1;
    }
  }
  if (buffer !== 0 || encode(bytes) !== value) {
    throw new TypeError('Noncanonical Homey feature flags');
  }
  return bytes;
}

function fromKeys(keys) {
  const bits = keys.map(key => {
    if (!Object.prototype.hasOwnProperty.call(FEATURE_BITS, key)) throw new TypeError(`Unknown Homey feature: ${key}`);
    return FEATURE_BITS[key];
  });
  const bytes = new Uint8Array(Math.ceil((Math.max(-1, ...bits) + 1) / 8));
  for (const bit of bits) {
    bytes[Math.floor(bit / 8)] |= 1 << (bit % 8);
  }
  return bytes;
}

function hasFeature(bytes, key) {
  if (!Object.prototype.hasOwnProperty.call(FEATURE_BITS, key)) return false;
  const bit = FEATURE_BITS[key];
  return Boolean(bytes[Math.floor(bit / 8)] & (1 << (bit % 8)));
}

function merge(rollout, released) {
  const bytes = new Uint8Array(Math.max(rollout.length, released.length));
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = (rollout[i] || 0) | (released[i] || 0);
  return bytes;
}

function parseSnapshot(value) {
  if (!value || !Number.isSafeInteger(value.revision) || value.revision < 0) {
    throw new TypeError('Invalid Homey feature revision');
  }
  decode(value.features);
  return { revision: value.revision, features: value.features };
}

function parseHeaders(headers) {
  try {
    const revision = headers.get('X-Homey-Features-Revision');
    if (
      headers.get('X-Homey-Features-Version') !== String(ENCODING_VERSION)
      || !/^(0|[1-9]\d*)$/.test(revision || '')
    ) {
      throw new TypeError('Unsupported Homey feature headers');
    }
    if (!Number.isSafeInteger(Number(revision))) {
      throw new TypeError('Invalid Homey feature revision');
    }
    return { revision: Number(revision), features: decode(headers.get('X-Homey-Features')) };
  } catch (err) {
    return { revision: 0, features: Uint8Array.of(0) };
  }
}

exports.ENCODING_VERSION = ENCODING_VERSION;
exports.MAX_BIT = MAX_BIT;
exports.MAX_BYTES = MAX_BYTES;
exports.MAX_ENCODED_LENGTH = MAX_ENCODED_LENGTH;
exports.HomeyFeature = HomeyFeature;
exports.FEATURE_BITS = FEATURE_BITS;
exports.encode = encode;
exports.decode = decode;
exports.fromKeys = fromKeys;
exports.hasFeature = hasFeature;
exports.merge = merge;
exports.parseSnapshot = parseSnapshot;
exports.parseHeaders = parseHeaders;
