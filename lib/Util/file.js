'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALLOWED_INTEGRITY_HASHES = new Set([
  'blake2b512',
  'blake2s256',
  'sha256',
  'sha384',
  'sha512',
  'sha512-256',
  'sha3-256',
  'sha3-384',
  'sha3-512',
]);

/**
 * Calculate a hex hash for the contents of a file.
 * @param {string} filePath - Absolute or relative path to the file.
 * @param {string} [hashName='sha256'] - Hash algorithm name (e.g. sha256).
 * @returns {Promise<string>} Resolves with a hex-encoded digest.
 */
async function hashFile(filePath, hashName = 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName);
    const stream = fs.createReadStream(filePath);

    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Validate file integrity using a `hashName:hexDigest` string.
 * @param {string} filePath - Absolute or relative path to the file.
 * @param {string} integrity - Hash name and hex digest separated by `:`.
 * @returns {Promise<boolean>} Resolves with true when hashes match.
 */
async function validateIntegrity(filePath, integrity) {
  if (typeof integrity !== 'string') {
    throw new TypeError('Integrity must be a string');
  }

  const parts = integrity.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Integrity must be in the format "hashName:hexDigest"');
  }

  const [hashName, expectedHex] = parts;
  const actualHex = await hashFile(filePath, hashName);

  return actualHex === expectedHex.toLowerCase();
}

/**
 * Create an integrity string for a file using an allowed hash algorithm.
 * @param {string} filePath - Absolute or relative path to the file.
 * @param {string} [hashName='sha256'] - Allowed hash algorithm name.
 * @returns {Promise<string>} Resolves with `hashName:hexDigest`.
 */
async function getIntegrity(filePath, hashName = 'sha256') {
  const normalizedHash = String(hashName || '').toLowerCase();

  if (!ALLOWED_INTEGRITY_HASHES.has(normalizedHash)) {
    throw new Error('Hash algorithm is not allowed for integrity checks');
  }

  const digest = await hashFile(filePath, normalizedHash);
  return `${normalizedHash}:${digest}`;
}

function getOTAFilePath({ appPath, driverId, fileName }) {
  return path.join(appPath || '', 'drivers', driverId, 'assets', 'firmware', fileName);
}

module.exports = {
  hashFile,
  getIntegrity,
  validateIntegrity,
  getOTAFilePath,
};
