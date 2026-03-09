'use strict';

const fs = require('fs');

const OTA_FILE_IDENTIFIER = 0x0BEEF11E;
const OTA_HEADER_VERSION = 0x0100;
const OTA_MIN_HEADER_LENGTH = 56;

const FIELD_CONTROL_BITS = {
  securityCredentialVersion: 1 << 0,
  deviceSpecificFile: 1 << 1,
  hardwareVersionsPresent: 1 << 2,
};

/**
 * @typedef {object} ZigbeeOTAHeader
 * @property {number} fileSize - File size in bytes.
 * @property {number} fileIdentifier - OTA file identifier.
 * @property {number} headerVersion - OTA header version.
 * @property {number} headerLength - OTA header length in bytes.
 * @property {number} fieldControl - Field control bitmask.
 * @property {number} manufacturerCode - Manufacturer code.
 * @property {number} imageType - Image type.
 * @property {number} fileVersion - File version.
 * @property {number} zigbeeStackVersion - Zigbee stack version.
 * @property {string} headerString - Header string (ASCII).
 * @property {number} totalImageSize - Total image size in bytes.
 * @property {number} [securityCredentialVersion] - Security credential version.
 * @property {string} [upgradeFileDestination] - Destination EUI64 hex string.
 * @property {number} [minimumHardwareVersion] - Minimum hardware version.
 * @property {number} [maximumHardwareVersion] - Maximum hardware version.
 * @property {number} remainingHeaderBytes - Unparsed header bytes.
 */

/**
 * Read a fixed-length slice from the start of a file.
 * @param {string} filePath - Absolute or relative path to the OTA file.
 * @param {number} length - Number of bytes to read.
 * @returns {Promise<Buffer>} Buffer with the requested bytes.
 */
async function readFileSlice(filePath, length) {
  const fileHandle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await fileHandle.read(buffer, 0, length, 0);
    if (bytesRead < length) {
      throw new Error('Unexpected end of file while reading Zigbee OTA header');
    }
    return buffer;
  } finally {
    await fileHandle.close();
  }
}

/**
 * Parse the Zigbee OTA header from a file.
 * @param {string} filePath - Absolute or relative path to the OTA file.
 * @returns {Promise<ZigbeeOTAHeader>} Parsed header values.
 */
async function parseZigbeeOTAHeader(filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new TypeError('filePath must be a non-empty string');
  }

  const stats = await fs.promises.stat(filePath);
  if (stats.size < OTA_MIN_HEADER_LENGTH) {
    throw new Error('File is too small to contain a Zigbee OTA header');
  }

  const baseHeader = await readFileSlice(filePath, OTA_MIN_HEADER_LENGTH);
  const baseFileIdentifier = baseHeader.readUInt32LE(0);

  if (baseFileIdentifier !== OTA_FILE_IDENTIFIER) {
    throw new Error('Invalid Zigbee OTA header identifier');
  }

  const headerLength = baseHeader.readUInt16LE(6);

  if (headerLength < OTA_MIN_HEADER_LENGTH) {
    throw new Error('Zigbee OTA header length is shorter than the mandatory header size');
  }
  if (headerLength > stats.size) {
    throw new Error('Zigbee OTA header length exceeds file size');
  }

  const headerBuffer = headerLength === OTA_MIN_HEADER_LENGTH
    ? baseHeader
    : await readFileSlice(filePath, headerLength);

  let offset = 0;
  const fileIdentifier = headerBuffer.readUInt32LE(offset);
  offset += 4;
  if (fileIdentifier !== OTA_FILE_IDENTIFIER) {
    throw new Error('Invalid Zigbee OTA header identifier');
  }
  const headerVersion = headerBuffer.readUInt16LE(offset);
  offset += 2;
  const parsedHeaderLength = headerBuffer.readUInt16LE(offset);
  offset += 2;
  const fieldControl = headerBuffer.readUInt16LE(offset);
  offset += 2;
  const manufacturerCode = headerBuffer.readUInt16LE(offset);
  offset += 2;
  const imageType = headerBuffer.readUInt16LE(offset);
  offset += 2;
  const fileVersion = headerBuffer.readUInt32LE(offset);
  offset += 4;
  const zigbeeStackVersion = headerBuffer.readUInt16LE(offset);
  offset += 2;
  const headerString = headerBuffer
    .toString('ascii', offset, offset + 32)
    .replace(/\0+$/, '');
  offset += 32;
  const totalImageSize = headerBuffer.readUInt32LE(offset);
  offset += 4;

  const header = {
    fileSize: stats.size,
    fileIdentifier,
    headerVersion,
    headerLength: parsedHeaderLength,
    fieldControl,
    manufacturerCode,
    imageType,
    fileVersion,
    zigbeeStackVersion,
    headerString,
    totalImageSize,
  };

  if (fieldControl & FIELD_CONTROL_BITS.securityCredentialVersion) {
    header.securityCredentialVersion = headerBuffer.readUInt8(offset);
    offset += 1;
  }

  if (fieldControl & FIELD_CONTROL_BITS.deviceSpecificFile) {
    header.upgradeFileDestination = headerBuffer
      .slice(offset, offset + 8)
      .toString('hex');
    offset += 8;
  }

  if (fieldControl & FIELD_CONTROL_BITS.hardwareVersionsPresent) {
    header.minimumHardwareVersion = headerBuffer.readUInt16LE(offset);
    offset += 2;
    header.maximumHardwareVersion = headerBuffer.readUInt16LE(offset);
    offset += 2;
  }

  if (parsedHeaderLength < offset) {
    throw new Error('Zigbee OTA header length is shorter than parsed fields');
  }

  header.remainingHeaderBytes = parsedHeaderLength - offset;

  return header;
}

/**
 * Validate a Zigbee OTA header against expected values.
 * @param {object} options - Validation options.
 * @param {string} options.filePath - Absolute or relative path to the OTA file.
 * @param {number} [options.manufacturerCode] - Expected manufacturer code.
 * @param {number} [options.fileVersion] - Expected file version.
 * @param {number} [options.imageType] - Expected image type.
 * @returns {Promise<ZigbeeOTAHeader>} Parsed header values.
 */
async function validateZigbeeOTAHeader({
  filePath,
  manufacturerCode,
  fileVersion,
  imageType,
} = {}) {
  const header = await parseZigbeeOTAHeader(filePath);

  if (header.fileIdentifier !== OTA_FILE_IDENTIFIER) {
    throw new Error('Invalid Zigbee OTA header identifier');
  }

  if (header.headerVersion !== OTA_HEADER_VERSION) {
    throw new Error('Unsupported Zigbee OTA header version');
  }

  if (header.headerLength > header.totalImageSize) {
    throw new Error('Zigbee OTA header length exceeds total image size');
  }

  if (header.totalImageSize !== header.fileSize) {
    throw new Error('Zigbee OTA total image size does not match file size');
  }

  if (manufacturerCode !== undefined) {
    if (typeof manufacturerCode !== 'number') {
      throw new TypeError('manufacturerCode must be a number');
    }
    if (header.manufacturerCode !== manufacturerCode) {
      throw new Error('Zigbee OTA manufacturer code does not match');
    }
  }

  if (imageType !== undefined) {
    if (typeof imageType !== 'number') {
      throw new TypeError('imageType must be a number');
    }
    if (header.imageType !== imageType) {
      throw new Error('Zigbee OTA image type does not match');
    }
  }

  if (fileVersion !== undefined) {
    if (typeof fileVersion !== 'number') {
      throw new TypeError('fileVersion must be a number');
    }
    if (header.fileVersion !== fileVersion) {
      throw new Error('Zigbee OTA file version does not match');
    }
  }

  return header;
}

module.exports = {
  parseZigbeeOTAHeader,
  validateZigbeeOTAHeader,
};
