'use strict';

const Capability = require('../Capability');

let classesCache;

class Device {

  /**
   * @returns {Record<string, Record<string, unknown>>}
   */
  static getClasses() {
    if (classesCache) return classesCache;

    // eslint-disable-next-line global-require
    const deviceClasses = require('../../assets/device/classes.json');
    classesCache = deviceClasses.reduce((obj, classId) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      obj[classId] = require(`../../assets/device/classes/${classId}.json`);
      return obj;
    }, {});
    return classesCache;
  }

  /**
   * @param {string} id
   * @returns {Record<string, unknown>}
   */
  static getClass(id) {
    const deviceClasses = Device.getClasses();
    const deviceClass = deviceClasses[id];
    if (!deviceClass) {
      throw new Error('invalid_class');
    }
    return deviceClass;
  }

  // legacy
  /**
   * @returns {ReturnType<typeof Capability.getCapabilities>}
   */
  static getCapabilities() {
    return Capability.getCapabilities();
  }

}

module.exports = Device;
