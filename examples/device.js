'use strict';

const Device = require('..').Device;

console.log('Classes:', Object.keys(Device.getClasses()));
console.log('Capabilities:', Object.keys(Device.getCapabilities()));