'use strict';

module.exports.App = require('./lib/App');
module.exports.Device = require('./lib/Device');
module.exports.Capability = require('./lib/Capability');
module.exports.Signal = require('./lib/Signal');
module.exports.Media = require('./lib/Media');

module.exports.getDeviceClasses = module.exports.Device.getClasses;
module.exports.getCapabilities = module.exports.Device.getCapabilities;
module.exports.getAppLocales = module.exports.App.getLocales;
module.exports.getAppCategories = module.exports.App.getCategories;
module.exports.getAppPermissions = module.exports.App.getPermissions;
module.exports.getMediaCodecs = module.exports.Media.getCodecs;