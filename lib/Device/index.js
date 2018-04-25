'use strict';

const path = require('path');

const deviceAssets = path.join(__dirname, '..', '..', 'assets', 'device' );

class Device {
	
	static getClasses() {
  	const classes = require(path.join(deviceAssets, 'classes.json'));
  	return classes.reduce((obj, classId) => {
      obj[classId] = require(path.join(deviceAssets, 'classes', `${classId}.json`))
      return obj;
  	}, {});
	}
	
	static getCapabilities() {
  	const capabilities = require(path.join(deviceAssets, 'capabilities.json'));
  	return capabilities.reduce((obj, capabilityId) => {
      obj[capabilityId] = require(path.join(deviceAssets, 'capabilities', `${capabilityId}.json`))
      return obj;
  	}, {});
	}
	
}

module.exports = Device;