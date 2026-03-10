'use strict';

const fileUtils = require('./file');
const zigbeeUtils = require('./zigbee');

class Util {

  /**
   * @param {string} modelId
   * @returns {string[]}
   */
  static getPlatformLocalFeatures(modelId) {
    return Util._platformLocalFeatures[modelId] || [];
  }

  /**
   * @param {string} modelId
   * @param {string[]} wantedFeatures
   * @returns {string[]}
   */
  static getMissingPlatformLocalFeatures(modelId, wantedFeatures) {
    const features = Util.getPlatformLocalFeatures(modelId);
    return wantedFeatures.filter(feature => !features.includes(feature));
  }

  /**
   * Create an integrity string for a file using an allowed hash algorithm.
   * NOTE: This method is only available in Node.js environments.
   * @param {string} filePath - Absolute or relative path to the file.
   * @param {string} hashName - Allowed hash algorithm name.
   * @returns {Promise<string>} Resolves with `hashName:hexDigest`.
   */
  static getIntegrity(filePath, hashName) {
    return fileUtils.getIntegrity(filePath, hashName);
  }

  /**
   * Validate file integrity using a `hashName:hexDigest` string.
   * NOTE: This method is only available in Node.js environments.
   * @param {string} filePath - Absolute or relative path to the file.
   * @param {string} integrity - Hash name and hex digest separated by `:`.
   * @returns {Promise<boolean>} Resolves with true when hashes match.
   */
  static validateIntegrity(filePath, integrity) {
    return fileUtils.validateIntegrity(filePath, integrity);
  }

  /**
   * Parse the Zigbee OTA header from a file.
   * NOTE: This method is only available in Node.js environments.
   * @param {string} filePath - Absolute or relative path to the OTA file.
   * @returns {Promise<import('./zigbee').ZigbeeOTAHeader>} Parsed header values.
   */
  static parseZigbeeOTAHeader(filePath) {
    return zigbeeUtils.parseZigbeeOTAHeader(filePath);
  }

  /**
   * Validate a Zigbee OTA header against expected values.
   * NOTE: This method is only available in Node.js environments.
   * @param {object} options - Validation options.
   * @param {string} options.filePath - Absolute or relative path to the OTA file.
   * @param {number} [options.manufacturerCode] - Expected manufacturer code.
   * @param {number} [options.fileVersion] - Expected file version.
   * @param {number} [options.imageType] - Expected image type.
   * @returns {Promise<import('./zigbee').ZigbeeOTAHeader>} Parsed header values.
   */
  static validateZigbeeOTAHeader(options) {
    return zigbeeUtils.validateZigbeeOTAHeader(options);
  }

  /**
   * Returns the expected file path for an OTA file based on app path, driver ID and file name.
   * NOTE: This method is only available in Node.js environments.
   * @param {object} options - File path options.
   * @param {string} options.appPath - Absolute path to the app.
   * @param {string} options.driverId - Driver ID.
   * @param {string} options.fileName - OTA file name.
   * @returns {string} Resolves with the expected file path.
   */
  static getOTAFilePath({ appPath, driverId, fileName }) {
    return fileUtils.getOTAFilePath({ appPath, driverId, fileName });
  }

}

Util.FEATURE_SPEAKER = 'speaker';
Util.FEATURE_LED_RING = 'ledring';
Util.FEATURE_NFC = 'nfc';
Util.FEATURE_MATTER = 'matter';
Util.FEATURE_CAMERA_STREAMING = 'camera-streaming';
/** @type {Record<string, string[]>} */
Util._platformLocalFeatures = {
  homey1s: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
  homey1d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
  homey1q: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
  homey2s: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
  homey2d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
  homey2q: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
  homey3s: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING],
  homey3d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING],
  homey4d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING],
  homey5q: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
  homey6q: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
  homey7q: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
  shs: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
};

module.exports = Util;
