'use strict';

const path = require('path');

class Device {
	
	constructor() {
		
	}
	
	static getClasses() {
		return require( path.join(__dirname, '..', '..', 'assets', 'device', 'classes.json' ) );		
	}
	
	static getCapabilities() {
		return require( path.join(__dirname, '..', '..', 'assets', 'device', 'capabilities.json' ) );
	}
	
}

module.exports = Device;