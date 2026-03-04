'use strict';

const App = require('./lib/App');
const Capability = require('./lib/Capability');
const Device = require('./lib/Device');
const Energy = require('./lib/Energy');
const Media = require('./lib/Media');
const Signal = require('./lib/Signal');
const Util = require('./lib/Util');

module.exports.App = App;
module.exports.Capability = Capability;
module.exports.Device = Device;
module.exports.Energy = Energy;
module.exports.Media = Media;
module.exports.Signal = Signal;
module.exports.Util = Util;

/** @type {typeof Device.getClasses} */
module.exports.getDeviceClasses = Device.getClasses.bind(Device);
/** @type {typeof Device.getClass} */
module.exports.getDeviceClass = Device.getClass.bind(Device);

/** @type {typeof Capability.getCapabilities} */
module.exports.getCapabilities = Capability.getCapabilities.bind(Capability);
/** @type {typeof Capability.getCapability} */
module.exports.getCapability = Capability.getCapability.bind(Capability);
/** @type {typeof Capability.hasCapability} */
module.exports.hasCapability = Capability.hasCapability.bind(Capability);

/** @type {typeof App.getLocales} */
module.exports.getAppLocales = App.getLocales.bind(App);
/** @type {typeof App.getCategories} */
module.exports.getAppCategories = App.getCategories.bind(App);
/** @type {typeof App.getPermissions} */
module.exports.getAppPermissions = App.getPermissions.bind(App);
/** @type {typeof App.getBrandColor} */
module.exports.getAppBrandColor = App.getBrandColor.bind(App);

/** @type {typeof Media.getCodecs} */
module.exports.getMediaCodecs = Media.getCodecs.bind(Media);

/** @type {typeof Energy.getCurrencies} */
module.exports.getCurrencies = Energy.getCurrencies.bind(Energy);
/** @type {typeof Energy.getBatteries} */
module.exports.getBatteries = Energy.getBatteries.bind(Energy);

/** @typedef {import('./lib/App').AppManifest} AppManifest */
/** @typedef {import('./lib/Capability').CapabilityDefinition} CapabilityDefinition */
