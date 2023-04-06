/* eslint-disable no-restricted-properties */
/* eslint-disable no-console */

'use strict';

const { URLSearchParams } = require('url');

const Ajv = require('ajv');
const semver = require('semver');
const tinycolor = require('tinycolor2');

const Device = require('../Device');
const Capability = require('../Capability');
const Signal = require('../Signal');
const Energy = require('../Energy');

const {
  openAsync,
  closeAsync,
  readAsync,
  statAsync,
  readFileAsync,
  readDirAsync,
  lstatAsync,
  imageSizeAsync,
  join,
  extname,
  basename,
  dirname,
} = require('../../helpers');

const VALIDATION_LEVELS = [
  'debug',
  'publish',
  'verified',
];

const IMAGE_MARKERS = {
  '.jpg': Buffer.from([0xFF, 0xD8]),
  '.jpeg': Buffer.from([0xFF, 0xD8]),
  '.png': Buffer.from([0x89, 0x50, 0x4e, 0x47]),
};
const IMAGE_SIZES = {
  app: {
    small: { width: 250, height: 175 },
    large: { width: 500, height: 350 },
    xlarge: { width: 1000, height: 700 },
  },
  driver: {
    small: { width: 75, height: 75 },
    large: { width: 500, height: 500 },
    xlarge: { width: 1000, height: 1000 },
  },
};
const BATTERY_CAPABILITIES = [
  'measure_battery',
  'alarm_battery',
];

class App {

  constructor(path) {
    this._path = path;

    if (typeof this._path !== 'string') {
      throw new Error('Invalid path');
    }
  }

  debug(...args) {
    if (!this._debug) return;
    console.log('[dbg]', ...args);
  }

  async validate({
    level = 'debug',
    debug = false,
  } = {}) {
    this._debug = debug;

    this.debug(`Validating "${this._path}"`);

    if (!VALIDATION_LEVELS.includes(level)) {
      throw new Error(`Invalid validation level. Allowed levels are: ${VALIDATION_LEVELS}`);
    }

    const levelPublish = (level === 'publish' || level === 'verified');
    const levelVerified = (level === 'verified');

    let appJson = await readFileAsync(join(this._path, 'app.json'));
    appJson = JSON.parse(appJson);

    const schema = App.getJSONSchema();

    const ajv = new Ajv({ async: true, allErrors: true });
    const validate = ajv.compile(schema);
    const valid = await validate(appJson);
    if (valid === false) throw new Error(this.constructor.errorsText(validate.errors, appJson) || 'Invalid app.json');

    // validate `appJson.id`
    if (!App.isValidId(appJson.id)) {
      throw new Error('Invalid id');
    }

    // validate `appJson.version`
    if (!semver.valid(appJson.version)) {
      throw new Error('Invalid version');
    }

    if (semver.coerce(appJson.version).toString() !== appJson.version) {
      throw new Error(`Invalid version (${appJson.version}), pre-release versions are not allowed`);
    }

    // validate `appJson.compatibility`
    if (!semver.validRange(appJson.compatibility)) {
      throw new Error('Invalid compatibility');
    }

    // validate sdk v3 apps have compatibility of at least >=5.0.0
    if (appJson.sdk === 3) {
      // lowest version that satisfies the compatibility
      const minVersion = semver.minVersion(appJson.compatibility);

      // lowest version must be greater than or equal to 5.0.0 for sdk v3 apps
      if (!semver.gt(minVersion, '4.2.0')) {
        throw new Error(`Invalid compatibility (${appJson.compatibility}), SDK version 3 apps must have a compatibility of at least >=5.0.0`);
      }
    }

    if (levelVerified) {
      if (appJson.platforms === undefined) {
        throw new Error('The property `platforms` is required in order to publish a verified app.');
      }

      if (appJson.support === undefined) {
        throw new Error('The property `support` is required in order to publish a verified app.');
      }
    }

    // validate `appJson.permissions`
    if (Array.isArray(appJson.permissions)) {
      const allowedPermissions = App.getPermissions();

      appJson.permissions.forEach(permission => {
        if (permission === 'homey:app:com.athom.homeyscript') {
          throw new Error(`Forbidden permission: ${permission}`);
        }

        if (permission === 'homey:manager:api') {
          if (levelPublish) {
            console.warn('Warning: using the homey:manager:api permission will require a more thorough review. It may take longer than usual to review your app.');
          }
        }

        if (permission === 'homey:manager:speech-input') {
          if (levelVerified) {
            throw new Error(`Unsupported permission: ${permission}, please remove any speech input related functionality.`);
          } else {
            console.warn('Warning: the homey:manager:speech-input permission is not supported, please remove any speech input related functionality.');
          }
        }

        if (permission.startsWith('homey:app:')) return;

        if (typeof allowedPermissions[permission] === 'undefined') {
          throw new Error(`Invalid permission: ${permission}`);
        }
      });
    }

    // validate `appJson.category`
    if (appJson.category) {
      const allowedCategories = App.getCategories();
      let categories = [];

      if (Array.isArray(appJson.category)) {
        categories = appJson.category;
      } else {
        categories = [appJson.category];
      }

      categories.forEach(category => {
        if (!allowedCategories.includes(category)) {
          throw new Error(`Invalid category: ${category}`);
        }
      });
    } else if (levelPublish) {
      throw new Error('The property `category` is required in order to publish an app.');
    }

    // validate `appJson.drivers`
    if (Array.isArray(appJson.drivers)) {
      const allowedClasses = Device.getClasses();
      const allowedCapabilities = Device.getCapabilities();

      for (let i = 0; i < appJson.drivers.length; i++) {
        const driver = appJson.drivers[i];

        // validate if `/drivers/:id` exists
        await this._ensureFileExistsCaseSensitive(join('drivers', driver.id));

        // validate `appJson.drivers[].class`
        if (typeof allowedClasses[driver.class] === 'undefined') {
          throw new Error(`drivers.${driver.id} invalid driver class: ${driver.class}`);
        }

        // validate `appJson.drivers[].capabilities`
        driver.capabilities.forEach(capability => {
          const capabilityId = capability.split('.')[0];
          const isSystemCapability = (typeof allowedCapabilities[capabilityId] !== 'undefined');
          const isAppCapability = (typeof appJson.capabilities !== 'undefined' && typeof appJson.capabilities[capabilityId] !== 'undefined');

          if (!isSystemCapability && !isAppCapability) {
            throw new Error(`drivers.${driver.id} invalid capability: ${capability}`);
          }

          // validate battery
          if (BATTERY_CAPABILITIES.includes(capabilityId)) {
            if (!driver.energy || !Array.isArray(driver.energy.batteries)) {
              if (levelPublish) {
                throw new Error(`drivers.${driver.id} is missing an array 'energy.batteries' because the capability ${capabilityId} is being used.`);
              }
            }
          }
        });

        // validate `appJson.drivers[].pair`
        if (Array.isArray(driver.pair)) {
          for (let j = 0; j < driver.pair.length; j++) {
            const pairView = driver.pair[j];

            // validate if navigation links to an existing view
            if (typeof pairView.navigation !== 'undefined') {
              const prevId = pairView.navigation.prev;
              if (prevId) {
                const found = driver.pair.find(pairView => {
                  return pairView.id === prevId;
                });

                if (!found) {
                  throw new Error(`drivers.${driver.id} invalid navigation.prev: ${prevId}`);
                }
              }

              const nextId = pairView.navigation.next;
              if (nextId) {
                const found = driver.pair.find(pairView => {
                  return pairView.id === nextId;
                });

                if (!found) {
                  throw new Error(`drivers.${driver.id} invalid navigation.next: ${nextId}`);
                }
              }
            }

            // validate if `/drivers/:id/pair/(/appJson.drivers[].pair[].id).html` exists
            if (typeof pairView.template === 'undefined') {
              await this._ensureFileExistsCaseSensitive(join('drivers', driver.id, 'pair', `${pairView.id}.html`));
            }
          }
        }

        // validate 'app.Json.drivers[].settings[].zwave'
        if (driver.zwave && Array.isArray(driver.settings)) {
          for (let j = 0; j < driver.settings.length; j++) {
            const setting = driver.settings[j];

            if (setting.type
              && setting.type === 'group'
              && setting.children
              && Array.isArray(setting.children)) {
              for (let k = 0; k < setting.children.length; k++) {
                const childSetting = setting.children[k];
                if (childSetting) {
                  this._checkZwaveForSetting(driver, childSetting);
                }
              }
            } else {
              this._checkZwaveForSetting(driver, setting);
            }
          }
        }

        // validate `appJson.drivers[].images`
        if (levelPublish) {
          if (!driver.images) {
            throw new Error(`drivers.${driver.id}: property \`images\` is required in order to publish an app.`);
          }
          await this._validateImages(driver.images, 'driver');
        }

        if (levelVerified) {
          if (driver.platforms === undefined) {
            throw new Error(`drivers.${driver.id}: property \`platforms\` is required in order to publish a verified app.`);
          }

          if (driver.connectivity === undefined) {
            throw new Error(`drivers.${driver.id}: property \`connectivity\` is required in order to publish a verified app.`);
          }
        }

        // validate `appJson.drivers[].platforms`
        if (!driver.platforms && appJson.platforms && appJson.platforms.includes('cloud')) {
          console.warn(`Warning: drivers.${driver.id} doesn't have a 'platforms' property. The default is ["local"].`);
        }

        if (driver.platforms && appJson.platforms) {
          if (driver.platforms.includes('local')) {
            if (appJson.platforms.includes('local') === false) {
              throw new Error(`drivers.${driver.id} invalid 'platforms': App manifest does not list 'local' as a supported platform.`);
            }
          }
          if (driver.platforms.includes('cloud')) {
            if (appJson.platforms.includes('cloud') === false) {
              throw new Error(`drivers.${driver.id} invalid 'platforms': App manifest does not list 'cloud' as a supported platform.`);
            }
          }
        }

        // validate `appJson.drivers[].connectivity`
        if (driver.connectivity && (driver.connectivity.includes('lan') || driver.connectivity.includes('rf868'))) {
          if (driver.platforms && driver.platforms.includes('cloud')) {
            throw new Error(`drivers.${driver.id} invalid 'connectivity': Platform 'cloud' does not support 'lan' or 'rf868'.`);
          }
        }

        // validate `appJson.drivers[].discovery`
        if (typeof driver.discovery === 'string') {
          if (!appJson.discovery || !appJson.discovery[driver.discovery]) {
            throw new Error(`drivers.${driver.id} invalid 'discovery': ${driver.discovery}`);
          }
        }

        if (typeof driver.energy === 'object') {
          if (Array.isArray(driver.energy.batteries)) {
            const allowedBatteries = Energy.getBatteries();
            driver.energy.batteries.forEach(battery => {
              if (!allowedBatteries.includes(battery)) {
                throw new Error(`drivers.${driver.id} invalid 'battery': ${battery}. Allowed values: ${allowedBatteries.join(', ')}`);
              }
            });
          }
        }
      }
    }

    // validate `appJson.capabilities`
    if (typeof appJson.capabilities !== 'undefined') {
      for (const capabilityId of Object.keys(appJson.capabilities)) {
        if (capabilityId.includes('.')) {
          throw new Error(`Invalid capability: ${capabilityId}\nCharacter '.' is reserved for subcapabilities.`);
        }

        const capability = appJson.capabilities[capabilityId];
        const capabilityInstance = new Capability(capability);

        try {
          await capabilityInstance.validate();
        } catch (err) {
          throw new Error(`Invalid capability: ${capabilityId}\n${err.message}`);
        }

        if (capability.icon) {
          await this._ensureFileExistsCaseSensitive(capability.icon);
        }
      }
    }

    // validate `appJson.signals`
    if (typeof appJson.signals !== 'undefined') {
      for (const frequency of Object.keys(appJson.signals)) {
        for (const signalId of Object.keys(appJson.signals[frequency])) {
          const signal = new Signal(appJson.signals[frequency][signalId], { frequency });
          try {
            await signal.validate();
          } catch (err) {
            throw new Error(`Invalid signal: ${frequency}.${signalId}\n${err.message}`);
          }
        }
      }
    }

    // validate `appJson.flow`
    if (appJson.flow) {
      for (const type of Object.keys(appJson.flow)) {
        const cards = appJson.flow[type];
        if (Array.isArray(cards)) {
          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];

            if (cards.findIndex(other => other.id === card.id) !== i) {
              if (appJson.sdk >= 3) {
                throw new Error(`Found multiple Flow card ${type} with the id "${card.id}", all Flow cards should have a unique id.`);
              } else {
                console.warn(`Warning: Found multiple Flow card ${type} with the id "${card.id}", all Flow cards should have a unique id.`);
              }
            }

            this._validateFlowCard(card, `flow.${type}['${card.id}']`, appJson, { levelPublish, levelVerified });
          }
        }
      }
    }

    // validate `appJson.discovery`
    if (appJson.discovery) {
      for (const discoveryId of Object.keys(appJson.discovery)) {
        const discovery = appJson.discovery[discoveryId];
        const { type } = discovery;
        if (!discovery[type]) {
          throw new Error(`Missing discovery.${discoveryId}.${type}`);
        }
      }
    }

    // validate if `/locales/:lang.json` exists & is valid
    if (await this._fileExistsCaseSensitive('locales')) {
      const allowedLocales = App.getLocales();
      const locales = await this._getDirectoryContents('locales');
      for (let i = 0; i < locales.length; i++) {
        const locale = locales[i];
        if (extname(locale) !== '.json') continue;
        const bn = basename(locale, '.json');

        if (!allowedLocales.includes(bn)) {
          throw new Error(`Invalid locale: /locales/${bn}.json\nAllowed locales are: ${allowedLocales}`);
        }

        try {
          const localeJson = await readFileAsync(locale, 'utf8');
          JSON.parse(localeJson);
        } catch (err) {
          throw new Error(`Malformed locale: /locales/${bn}.json\n${err.message}`);
        }
      }
    }

    // validate if `/app.js` exists
    if (!appJson.sdk || appJson.sdk === 1) {
      await this._ensureFileExistsCaseSensitive('app.js');
    }

    // validate `/env.json`
    if (await this._fileExistsCaseSensitive('env.json')) {
      let envJson;
      try {
        envJson = await readFileAsync(join(this._path, 'env.json'), 'utf8');
        envJson = JSON.parse(envJson);
      } catch (err) {
        throw new Error(`Malformed file: /env.json\n${err.message}`);
      }

      if (envJson) {
        for (const key of Object.keys(envJson)) {
          if (key.toUpperCase() !== key) {
            throw new Error(`Invalid /env.json key, must be uppercase: ${key}`);
          }

          const value = envJson[key];
          if (typeof value !== 'string') {
            throw new Error(`Invalid /env.json value, must be of type string: ${value}`);
          }
        }
      }
    }

    // validate if `/assets/icon.svg` exists
    await this._ensureFileExistsCaseSensitive(join('assets', 'icon.svg'));

    // validate `/settings/`
    if (await this._fileExistsCaseSensitive('settings')) {
      await this._ensureFileExistsCaseSensitive(join('settings', 'index.html'));
    }

    if (levelPublish) {
      if (!appJson.images) {
        throw new Error('The property `images` is required in order to publish an app.');
      }
      await this._validateImages(appJson.images, 'app');
      await this._validateModules();
    }

    if (appJson.brandColor) {
      if (!this.constructor.isValidBrandColor(appJson.brandColor)) {
        throw new Error('The color defined in `brandColor` is too bright. Icons are rendered white, so choose a darker color that has enough contrast.');
      }
    } else if (levelPublish) {
      throw new Error('The property `brandColor` is required in order to publish an app.');
    }

    this.debug('Validated successfully');
  }

  _checkZwaveForSetting(driver, setting) {
    if (!driver || !setting || !setting.zwave) return;
    if (typeof setting.zwave.index !== 'number' || typeof setting.zwave.size !== 'number') throw new Error(`Missing property in "zwave" at ${driver.id}, ${setting.id}`);
    else if ((setting.attr && typeof setting.attr.max === 'number') || typeof setting.max === 'number') {
      const { size } = setting.zwave;

      let max = typeof setting.attr.max === 'number' ? setting.attr.max : setting.max;
      const stepsize = typeof setting.attr.step === 'number' ? setting.attr.step : 1;

      if (stepsize > 1) max /= stepsize;
      const signed = typeof setting.zwave.signed === 'boolean' ? setting.zwave.signed : true;

      const maxSigned = (Math.pow(2, size * 8) / 2) - 1;
      const maxUnsigned = Math.pow(2, size * 8) - 1;

      if (signed && (max) > maxSigned) {
        throw new Error(`Value cannot be signed: ${driver.id}, ${setting.id}. Max value: ${maxSigned}, actual value: ${max}`);
      } else if (!signed && (max) > maxUnsigned) {
        throw new Error(`Max value out of bounds: ${driver.id}, ${setting.id}.  Max value: ${maxUnsigned}, actual value: ${max}`);
      }
    }
  }

  async _getDirectoryContents(filepath) {
    await this._fileExistsCaseSensitive(filepath);

    filepath = join(this._path, filepath);

    return readDirAsync(filepath).then(files => {
      return files.map(file => {
        return join(filepath, file);
      });
    });
  }

  async _ensureFileExistsCaseSensitive(filepath) {
    const exists = await this._fileExistsCaseSensitive(filepath);
    if (exists !== true) {
      throw new Error(`Filepath does not exist: ${filepath}`);
    }
  }

  async _fileExistsCaseSensitive(filepath) {
    filepath = join(this._path, filepath);
    const dir = dirname(filepath);

    try {
      const stat = await statAsync(dir);
      if (!stat.isDirectory()) return false;

      const contents = await readDirAsync(dir);
      return contents.indexOf(basename(filepath)) > -1;
    } catch (err) {
      return false;
    }
  }

  async _validateImages(imagesObj, type) {
    const sizes = ['small', 'large'];
    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const imagePath = imagesObj[size];
      const extension = extname(imagePath);

      if (typeof IMAGE_MARKERS[extension] === 'undefined') {
        throw new Error(`Invalid image extention: ${extension}`);
      }

      await this._ensureFileExistsCaseSensitive(imagePath);

      const compareBuffer = IMAGE_MARKERS[extension];
      const imageBytes = await this._readBytes(imagePath, compareBuffer.length);

      if (!imageBytes.equals(compareBuffer)) {
        throw new Error(`Invalid image: ${imagePath}`);
      }

      const requiredSize = IMAGE_SIZES[type][size];
      const imageSize = await imageSizeAsync(join(this._path, imagePath));
      if (imageSize.width !== requiredSize.width
        || imageSize.height !== requiredSize.height) {
        throw new Error(`Invalid image size (${imageSize.width}x${imageSize.height}): ${imagePath}\nRequired: ${requiredSize.width}x${requiredSize.height}`);
      }
    }
  }

  async _validateModules() {
    const nodeModulesPath = join(this._path, 'node_modules');

    try {
      await statAsync(nodeModulesPath);
    } catch (err) {
      return;
    }

    // Make sure there are no symlinked (`npm link`) modules left in `node_modules`.
    for (const file of await readDirAsync(nodeModulesPath)) {
      let stat;
      try {
        stat = await lstatAsync(join(nodeModulesPath, file));
      } catch (e) {
        throw Error(`Invalid module '${file}' in 'node_modules': ${e.message}`);
      }
      if (stat.isSymbolicLink()) {
        throw Error(`Invalid module '${file}' in 'node_modules': is a symbolic link`);
      }
    }
  }

  _validateFlowCard(card, errorPath, appJson, { levelPublish, levelVerified }) {
    if (Array.isArray(card.tokens)) {
      for (const token of card.tokens) {
        if (typeof token.type !== 'string') {
          console.warn(`Warning: ${errorPath}.tokens['${token.name}'].type is missing, it defaults to "string". Specifying a token type will be required in the future.`);
        }
      }
    }

    if (Array.isArray(card.args) === false) return;

    const firstDeviceArgument = card.args.find(argument => {
      const filter = new URLSearchParams(argument.filter);
      return argument.type === 'device' && (filter.has('driver_id') || filter.has('driverId'));
    });

    // Filter to valid arguments for flow card titles
    const filteredCardArgs = card.args.filter(argument => {
      return argument !== firstDeviceArgument;
    });

    if (filteredCardArgs.length === 0) return;

    if (levelVerified) {
      for (const argument of filteredCardArgs) {
        if (argument.title === undefined) {
          throw new Error(`${errorPath}.args['${argument.name}'].title is required for arguments in order to publish a verified app.`);
        }
      }
    }

    if (card.droptoken) {
      filteredCardArgs.push({ name: 'droptoken' });
    }

    if (card.titleFormatted === undefined) {
      if (levelVerified) {
        throw new Error(`${errorPath}.titleFormatted is required in order to publish a verified app.`);
      } else {
        console.warn(`Warning: ${errorPath}.titleFormatted is missing. Specifying a Flow card's formatted title will be required in the future.`);
      }
    }

    if (typeof card.titleFormatted === 'string') {
      App._checkTitleFormatted(card.titleFormatted, filteredCardArgs, `${errorPath}.titleFormatted`);
      return;
    }

    if (typeof card.titleFormatted === 'object' && card.titleFormatted !== null) {
      for (const [language, titleFormatted] of Object.entries(card.titleFormatted)) {
        App._checkTitleFormatted(titleFormatted, filteredCardArgs, `${errorPath}.titleFormatted.${language}`);
      }
    }

    // validate `appJson.flow[].platforms`
    if (card.platforms && appJson.platforms) {
      if (card.platforms.includes('local')) {
        if (appJson.platforms.includes('local') === false) {
          throw new Error(`${errorPath} invalid 'platforms': App manifest does not list 'local' as a supported platform.`);
        }
      }
      if (card.platforms.includes('cloud')) {
        if (appJson.platforms.includes('cloud') === false) {
          throw new Error(`${errorPath} invalid 'platforms': App manifest does not list 'cloud' as a supported platform.`);
        }
      }
    }
  }

  static _checkTitleFormatted(titleFormatted, args, errorPath) {
    const argsPresent = args.reduce((obj, arg) => {
      obj[arg.name] = false;
      return obj;
    }, {});

    // Match any characters between `[[` and `]]`
    const argsMatches = titleFormatted.match(/\[\[(.*?)\]\]/gm);
    if (argsMatches === null) {
      throw Error(`Missing all args in ${errorPath}`);
    }

    argsMatches.forEach(argMatch => {
      const argName = argMatch.substring(2, argMatch.length - 2);
      if (typeof argsPresent[argName] === 'undefined') {
        throw Error(`Invalid [[${argName}]] in ${errorPath}.titleFormatted`);
      }

      if (argsPresent[argName] === true) {
        throw Error(`Duplicate [[${argName}]] in ${errorPath}.titleFormatted`);
      }

      if (argsPresent[argName] === false) {
        argsPresent[argName] = true;
      }
    });

    for (const [argName, isPresent] of Object.entries(argsPresent)) {
      if (isPresent === false) {
        throw Error(`Missing [[${argName}]] in ${errorPath}`);
      }
    }
  }

  async _readBytes(filepath, numBytes) {
    filepath = join(this._path, filepath);

    const fd = await openAsync(filepath, 'r');
    const buffer = Buffer.alloc(numBytes);
    await readAsync(fd, buffer, 0, numBytes, 0);
    await closeAsync(fd);
    return buffer;
  }

  static isValidId(appId) {
    if (typeof appId !== 'string') return false;
    if (appId.length < 1) return false;
    if (appId.split('.').length < 2) return false;
    if (!(/^[a-zA-Z0-9_.-]*$/g).test(appId)) return false;
    return true;
  }

  static isValidBrandColor(color) {
    return tinycolor(color).getBrightness() <= 184; // empirically determined by many colorpicker samples
  }

  static getJSONSchema() {
    // eslint-disable-next-line global-require
    const schema = require('../../assets/app/schema.json');
    return JSON.parse(JSON.stringify(schema));
  }

  static getPermissions() {
    // eslint-disable-next-line global-require
    const permissions = require('../../assets/app/permissions.json');

    if (typeof join === 'function') {
      for (const permissionId of Object.keys(permissions)) {
        const permission = permissions[permissionId];
        permission.icon = join(__dirname, '..', '..', 'assets', 'app', 'permissions', `${permissionId.replace(/:/g, '-')}.svg`);
      }
    }

    return permissions;
  }

  static getCategories() {
    return ['lights', 'video', 'music', 'appliances', 'security', 'climate', 'tools', 'internet', 'localization', 'energy'];
  }

  static getLocales() {
    // eslint-disable-next-line max-len
    return ['ab', 'aa', 'af', 'ak', 'sq', 'am', 'ar', 'an', 'hy', 'as', 'av', 'ae', 'ay', 'az', 'bm', 'ba', 'eu', 'be', 'bn', 'bh', 'bi', 'bs', 'br', 'bg', 'my', 'ca', 'ch', 'ce', 'ny', 'zh', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'nl', 'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'fr', 'ff', 'gl', 'ka', 'de', 'el', 'gn', 'gu', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'ia', 'id', 'ie', 'ga', 'ig', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'kl', 'kn', 'kr', 'ks', 'kk', 'km', 'ki', 'rw', 'ky', 'kv', 'kg', 'ko', 'ku', 'kj', 'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'gv', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mh', 'mn', 'na', 'nv', 'nd', 'ne', 'ng', 'nb', 'nn', 'no', 'ii', 'nr', 'oc', 'oj', 'cu', 'om', 'or', 'os', 'pa', 'pi', 'fa', 'pl', 'ps', 'pt', 'qu', 'rm', 'rn', 'ro', 'ru', 'sa', 'sc', 'sd', 'se', 'sm', 'sg', 'sr', 'gd', 'sn', 'si', 'sk', 'sl', 'so', 'st', 'es', 'su', 'sw', 'ss', 'sv', 'ta', 'te', 'tg', 'th', 'ti', 'bo', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk', 'ur', 'uz', 've', 'vi', 'vo', 'wa', 'cy', 'wo', 'fy', 'xh', 'yi', 'yo', 'za', 'zu'];
  }

  static getBrandColor(appId) {
    const appIdHex = Buffer.from(appId).toString('hex');
    let brandColor;
    let i = 0;

    do {
      const hexString = `${appIdHex}${++i}`;
      let color = tinycolor(`#${hexString.substring(hexString.length - 6)}`);
      color = tinycolor({
        h: color.toHsv().h,
        s: 0.75,
        l: 0.5,
      });

      const hex = color.toHexString();
      if (this.isValidBrandColor(hex)) {
        brandColor = hex;
      }
    } while (!brandColor);

    return brandColor;
  }

  static errorsText(errors, appJson) {
    if (Array.isArray(errors) === false) return null;

    return errors.reduce((message, error) => {
      let info = '';

      // Replace `drivers[0]` with `drivers['driver_id']`
      const regex = new RegExp('drivers\\[(\\d+)\\]');
      const match = error.dataPath.match(regex);
      if (match) {
        const index = parseInt(match[1], 10);
        const driver = appJson.drivers[index];
        if (driver) {
          error.dataPath = error.dataPath.replace(`drivers[${index}]`, `drivers['${driver.id}']`);
        }
      }

      // Replace `flow.actions[0].args[0]` with `flow.actions['my_card_id'].args['my_arg_id']`
      ['triggers', 'conditions', 'actions'].forEach(type => {
        const regex = new RegExp(`flow.${type}\\[(\\d+)\\]`);
        const match = error.dataPath.match(regex);
        if (match) {
          const index = parseInt(match[1], 10);
          const card = appJson.flow[type][index];
          if (card) {
            error.dataPath = error.dataPath.replace(`flow.${type}[${index}]`, `flow.${type}['${card.id}']`);

            // Replace args
            const regex = new RegExp('.args\\[(\\d+)\\]');
            const match = error.dataPath.match(regex);
            if (match) {
              const index = parseInt(match[1], 10);
              const arg = card.args[index];
              if (arg) {
                error.dataPath = error.dataPath.replace(`.args[${index}]`, `.args['${arg.name}']`);
              }
            }
          }
        }
      });

      switch (error.keyword) {
        case 'oneOf':
          return `${message}manifest${error.dataPath} matched no available schemas, see previous errors\n`;

        case 'enum':
          info = JSON.stringify(error.params.allowedValues);
          break;
        default: {
          break;
        }
      }

      return `${message}manifest${error.dataPath} ${error.message} ${info}\n`;
    }, '').slice(0, -1); // remove final '\n' character
  }

}

module.exports = App;
