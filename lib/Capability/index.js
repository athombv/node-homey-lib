/* eslint-disable no-console */

'use strict';

const Ajv = require('ajv');

let capabilitiesCache;

class Capability {

  /**
   * @param {Record<string, unknown>} capability
   */
  constructor(capability) {
    this._capability = capability;
  }

  /**
   * @param {...unknown} args
   * @returns {void}
   */
  debug(...args) {
    if (!this._debug) return;
    console.log('[dbg]', ...args);
  }

  /**
   * @param {{ debug?: boolean }} [options]
   * @returns {Promise<void>}
   */
  async validate({
    debug = false,
  } = {}) {
    this._debug = debug;

    this.debug('Validating capability');

    const schema = Capability.getJSONSchema();
    const avj = new Ajv({ async: true });
    const validate = avj.compile(schema);
    const valid = await validate(this._capability);
    if (valid === false) throw new Error(JSON.stringify(validate.errors, false, 4) || 'Invalid Capability');

    this.debug('Validated successfully');
  }

  /**
   * @returns {Record<string, unknown>}
   */
  static getJSONSchema() {
    // eslint-disable-next-line global-require
    return require('../../assets/capability/schema.json');
  }

  /**
   * @returns {Record<string, Record<string, unknown>>}
   */
  static getCapabilities() {
    if (capabilitiesCache) return capabilitiesCache;

    // eslint-disable-next-line global-require
    const capabilities = require('../../assets/capability/capabilities.json');
    capabilitiesCache = capabilities.reduce((obj, capabilityId) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      obj[capabilityId] = require(`../../assets/capability/capabilities/${capabilityId}.json`);
      obj[capabilityId] = Capability._composeCapability(capabilityId, obj[capabilityId]);
      return obj;
    }, {});
    return capabilitiesCache;
  }

  /**
   * @param {string} id
   * @returns {Record<string, unknown>}
   */
  static getCapability(id) {
    const capabilities = Capability.getCapabilities();
    const capability = capabilities[id];
    if (!capability) {
      throw new Error('invalid_capability');
    }
    return capability;
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  static hasCapability(id) {
    const capabilities = this.getCapabilities();
    return !!capabilities[id];
  }

  /**
   * @param {string} capabilityId
   * @param {Record<string, unknown>} capability
   * @returns {Record<string, unknown>}
   */
  static _composeCapability(capabilityId, capability) {
    if (capability.flow) console.warn(`Warning: using \`capability.flow\` (${capabilityId}), expected a \`capability.$flow\``);
    if (capability.$flow) {
      ['triggers', 'conditions', 'actions'].forEach(type => {
        const cards = capability.$flow[type];
        if (!Array.isArray(cards)) return;
        cards.forEach(card => {
          if (Array.isArray(card.args)) {
            card.args.forEach(arg => {
              // allow `"values": "$values"` to copy values from the capability
              if (arg.type === 'dropdown') {
                if (arg.values === '$values') {
                  arg.values = capability.values;
                  arg.meta = arg.meta || {};
                  arg.meta.$values = true;
                }
              }
            });
          }

          // Replace template variables
          if (Array.isArray(card.tokens)) {
            card.tokens.forEach(token => {
              if (token.name === '$id') {
                token.name = capabilityId;
              }

              if (token.type === '$type') {
                token.type = capability.type;
              }

              if (token.title === '$title') {
                token.title = capability.title;
              }
            });
          }
        });
      });
    }

    return capability;
  }

  /**
   * @param {string} capabilityIdToCheck
   * @param {string} capabilityId
   * @returns {boolean}
   */
  static isInstanceOfId(capabilityIdToCheck, capabilityId) {
    return (
      capabilityId === capabilityIdToCheck || capabilityIdToCheck.startsWith(`${capabilityId}.`)
    );
  }

  /**
   * @param {string} capabilityId
   * @returns {string}
   */
  static getBaseId(capabilityId) {
    const parts = capabilityId.split('.');
    return parts[0];
  }

}

module.exports = Capability;
