'use strict';

const Device = require('..').Device;

const capabilities = Device.getCapabilities();
const capabilityId = process.argv[2] || 'onoff';
console.log(JSON.stringify({ [capabilityId]: capabilities[capabilityId] }, false, 2))