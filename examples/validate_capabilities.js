"use strict";

var devkit_lib = require('..');

var deviceclasses = devkit_lib.deviceclasses.getDeviceClasses();

var allValid = true;
for( let capabilityId in deviceclasses.capabilities ) {

	var isValid = devkit_lib.deviceclasses.validateCapability( deviceclasses.capabilities[ capabilityId ] );
	if( isValid === true ) continue;
	allValid = false;

	console.log( capabilityId, isValid );
}

if( allValid === true ) {
	console.log('All valid!');
}