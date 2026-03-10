'use strict';

const {
  validate,
  genericValidator,
  irValidator,
  rfValidator,
  rf433Validator,
  rf868Validator,
  modulationValidator,
  prontoValidator,
} = require('./validators');

/**
 * @typedef {'433' | '868' | 'ir'} SignalFrequency
 */

class Signal {

  /**
   * @param {Record<string, unknown>} signal
   * @param {{ frequency?: SignalFrequency }} [options]
   */
  constructor(signal, { frequency = undefined } = {}) {
    this._signal = signal;
    this._frequency = frequency;

    this._check = this._check.bind(this);
  }

  /**
   * @param {...unknown} args
   * @returns {void}
   */
  debug(...args) {
    if (!this._debug) return;

    // eslint-disable-next-line no-console
    console.log('[dbg]', ...args);
  }

  /**
   * @param {string} message
   * @param {boolean} result
   * @returns {void}
   */
  _check(message, result) {
    if (result !== true) {
      throw new Error(message);
    }
  }

  /**
   * @param {{ debug?: boolean }} [options]
   * @returns {Promise<void>}
   */
  async validate({
    debug = false,
  } = {}) {
    this._debug = debug;

    this.debug('Validating signal');

    if (!this._signal) {
      throw new Error('Invalid Signal');
    }

    if (this._signal.type === 'prontohex') {
      this._validateProntohex();
    } else if (typeof this._signal.type === 'undefined') {
      this._validateRegular();
    } else {
      throw new Error('Invalid Signal type');
    }

    if (this._frequency === '433') {
      this._validate433();
    } else if (this._frequency === '868') {
      this._validate868();
    } else if (this._frequency === 'ir') {
      this._validateInfrared();
    } else {
      throw new Error('Invalid Frequency');
    }

    this.debug('Validated successfully');
  }

  /**
   * @param {Record<string, (value: unknown, signal: Record<string, unknown>) => { result: boolean, msg: string }>} validatorEngine
   * @returns {void}
   */
  _validateWithEngine(validatorEngine) {
    return validate(validatorEngine, this._check, this._signal);
  }

  _validateProntohex() {
    // eslint-disable-next-line no-prototype-builtins
    this._check('mandatory_fields', this._signal.hasOwnProperty('cmds'));
    this._validateWithEngine(prontoValidator);
  }

  _validateRegular() {
    // eslint-disable-next-line no-prototype-builtins
    this._check('mandatory_fields', this._signal.hasOwnProperty('sof') || this._signal.hasOwnProperty('eof') || this._signal.hasOwnProperty('words'));
    this._validateWithEngine(genericValidator);
    this._validateWithEngine(rfValidator);
  }

  _validate433() {
    this._validateWithEngine(modulationValidator);
    this._validateWithEngine(rf433Validator);
  }

  _validate868() {
    this._validateWithEngine(modulationValidator);
    this._validateWithEngine(rf868Validator);
  }

  _validateInfrared() {
    this._validateWithEngine(irValidator);
  }

}

module.exports = Signal;
