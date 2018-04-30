'use strict';

const path = require('path');

const Capability = require('../Capability');

const deviceAssets = path.join(__dirname, '..', '..', 'assets', 'device' );
let classesCache;


class Device {
	
	static getClasses() {
  	if( classesCache ) return classesCache;
  	
  	const classes = require(path.join(deviceAssets, 'classes.json'));
  	classesCache = classes.reduce((obj, classId) => {
      obj[classId] = require(path.join(deviceAssets, 'classes', `${classId}.json`))
      return obj;
  	}, {});
  	return classesCache;
	}
	
  // legacy
	static getCapabilities() {
  	return Capability.getCapabilities();
	}
	
}

module.exports = Device;