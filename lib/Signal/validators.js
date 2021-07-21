/* eslint-disable */

'use strict';

/* static functions */
function validate(validator, check, signal) {
  for (const propName in signal) {
    const property = signal[propName];
    const validate = validator[propName];
    if (typeof validate === 'function') {
      const res = validate(property, signal);
      check(res.msg, res.result);
    }
  }
}

function _valid_bounds(value, min, max) {
  let res = true;
  if (value instanceof Array) {
    value.forEach(val => {
      if (val < min || val > max) {
        res = false;
      }
    });
  } else if (typeof value === 'number') {
    if (value < min || value > max) {
      res = false;
    }
  }

  return res;
}

function _valid_odd_signal(signal) {
  if (signal.hasOwnProperty('manchesterUnit')) return true;
  if (!signal.hasOwnProperty('interval')) return true;

  let total = 0;
  total += (signal.sof instanceof Array) ? signal.sof.length : 0;
  total += (signal.eof instanceof Array) ? signal.eof.length : 0;

  return total % 2 !== 0;
}

function _valid_pronto_string(pronto) {
  return typeof pronto === 'string' && (/^(([0-9a-f]{4}\s?){2}){2,}$/i).test(pronto);
}

/* property validators */
const genBounds = {
  manchesterMaxUnits: { min: 1, max: 1000 },
  sensitivity: { min: 0.0, max: 0.5 },
  minimalLength: { min: 0, max: 1000 },
  maximalLength: { min: 0, max: 1000 },
};

function _validateGenericData(data, signal) {
  const res = { result: true, msg: `invalid_${this}` };
  if (!(data instanceof Array)) {
    res.result = false;
    return res;
  }
  if (signal.packing) {
    if (data.some(word => {
      return !(word >= 0 && word <= 0xFF);
    })) res.result = false;
  } else if (data.some(word => {
    return (!signal.words || !signal.words[word]);
  })) res.result = false;
  return res;
}

const genericValidator = {
  words(words, signal) {
    const res = { result: true, msg: 'invalid_words' };
    if (!(words instanceof Array) || words.length <= 1) {
      res.result = false;
      return res;
    }
    // check if word has more then 1 interval
    words.forEach(word => {
      if (!(word instanceof Array) || word.length <= 1) {
        res.result = false;
        return res;
      }
    });
    return res;
  },
  agc(agc, signal) {
    const res = agc instanceof Array;
    return { result: res, msg: 'invalid_agc' };
  },
  sof(sof, signal) {
    const res = sof instanceof Array;
    return { result: res, msg: 'invalid_sof' };
  },
  toggleSof(toggleSof, signal) {
    const res = toggleSof instanceof Array;
    return { result: res, msg: 'invalid_toggleSof' };
  },
  eof(eof, signal) {
    const res = eof instanceof Array;
    return { result: res, msg: 'invalid_eof' };
  },
  manchesterUnit(manchesterUnit, signal) {
    const res = typeof manchesterUnit === 'number';
    return { result: res, msg: 'invalid_manchesterUnit' };
  },
  manchesterMaxUnits(manchesterMaxUnits, signal) {
    const res = typeof manchesterMaxUnits === 'number' && manchesterMaxUnits >= genBounds.manchesterMaxUnits.min;
    return { result: res, msg: 'invalid_manchesterMaxUnits' };
  },
  sensitivity(sensitivity, signal) {
    const res = typeof sensitivity === 'number' && _valid_bounds(sensitivity, genBounds.sensitivity.min, genBounds.sensitivity.max);
    return { result: res, msg: 'invalid_sensitivity' };
  },
  interval(interval, signal) {
    const res = typeof interval === 'number';
    return { result: res, msg: 'invalid_signalinterval' };
  },
  minimalLength(minLength, signal) {
    const res = minLength > 0;
    return { result: res, msg: 'invalid_minimalLength' };
  },
  maximalLength(maxLength, signal) {
    const res = maxLength > 0;
    return { result: res, msg: 'invalid_maximalLength' };
  },
  packing(packing, signal) {
    const res = typeof packing === 'boolean' && signal.words && signal.words.length == 2;
    return { result: res, msg: 'invalid_packing' };
  },
  dutyCycle(dutyCycle, signal) {
    const res = typeof dutyCycle === 'number';
    return { result: res, msg: 'invalid_dutyCycle' };
  },
  txOnly(txOnly, signal) {
    const res = typeof txOnly === 'boolean';
    return { result: res, msg: 'invalid_txOnly' };
  },
  cmds(cmds, signal) {
    const res = { result: true, msg: 'invalid_cmd' };
    Object.keys(cmds).forEach(cmd => {
      if (!_validateGenericData(cmds[cmd], signal).result) res.result = false;
    });
    return res;
  },
  toggleIndexes(toggleIndexes, signal) {
    const res = toggleIndexes instanceof Array && !toggleIndexes.some(index => {
      return index >= signal.sof.length;
    });
    return { result: res, msg: 'invalid_toggleIndexes' };
  },
  toggleBits(toggleBits, signal) {
    const res = toggleBits instanceof Array;
    return { result: res, msg: 'invalid_toggleBits' };
  },
  prefixData: _validateGenericData.bind('prefixData'),
  postfixData: _validateGenericData.bind('postfixData'),
};

const rfBounds = {
  timeInterval: { min: 5, max: 32767 },
  manchesterInterval: { min: 0, max: 1 },
  rxTimeout: { min: 0, max: 255 },
  repetitions: { min: 1, max: 255 },
};

const rfValidator = {

  words(words, signal) {
    const res = { result: true, msg: 'word_interval_out_of_bounds' };
    const bounds = !signal.hasOwnProperty('manchesterUnit') ? rfBounds.timeInterval : rfBounds.manchesterInterval;
    words.forEach(word => {
      if (!_valid_bounds(word, bounds.min, bounds.max)) {
        res.result = false;
      }
    });
    return res;
  },
  agc(agc, signal) {
    const bounds = !signal.hasOwnProperty('manchesterUnit') ? rfBounds.timeInterval : rfBounds.manchesterInterval;
    const res = _valid_bounds(agc, bounds.min, bounds.max);
    return { result: res, msg: 'agc_out_of_bounds' };
  },
  toggleSof(toggleSof, signal) {
    const bounds = !signal.hasOwnProperty('manchesterUnit') ? rfBounds.timeInterval : rfBounds.manchesterInterval;
    const res = _valid_bounds(toggleSof, bounds.min, bounds.max);
    return { result: res, msg: 'toggleSof_out_of_bounds' };
  },
  sof(sof, signal) {
    const bounds = !signal.hasOwnProperty('manchesterUnit') ? rfBounds.timeInterval : rfBounds.manchesterInterval;
    const res = _valid_bounds(sof, bounds.min, bounds.max);
    return { result: res, msg: 'sof_out_of_bounds' };
  },
  eof(eof, signal) {
    const bounds = !signal.hasOwnProperty('manchesterUnit') ? rfBounds.timeInterval : rfBounds.manchesterInterval;
    const res = _valid_bounds(eof, bounds.min, bounds.max);
    return { result: res, msg: 'eof_out_of_bounds' };
  },
  repetitions(repetitions, signal) {
    const res = _valid_bounds(repetitions, rfBounds.repetitions.min, rfBounds.repetitions.max);
    return { result: res, msg: 'repetitions_out_of_bounds' };
  },
  interval(interval, signal) {
    const res = _valid_bounds(interval, rfBounds.timeInterval.min, rfBounds.timeInterval.max);
    return { result: res, msg: 'interval_out_of_bounds' };
  },
  rxTimeout(rxTimeout, signal) {
    const res = _valid_bounds(rxTimeout, rfBounds.rxTimeout.min, rfBounds.rxTimeout.max);
    return { result: res, msg: 'rxTimeout_out_of_bounds' };
  },
  manchesterUnit(manchesterUnit, signal) {
    const res = _valid_bounds(manchesterUnit, rfBounds.timeInterval.min, rfBounds.timeInterval.max);
    return { result: res, msg: 'manchesterUnit_out_of_bounds' };
  },
};

const modulationBounds = {
  baudRate: { min: 1000, max: 200000 },
  channelSpacing: { min: 58000, max: 812000 },
  channelDeviation: { min: 5000, max: 50000 },
};

const modulationValidator = {
  modulation(modulation, signal) {
    // replace by default modulation props in homey-microcontroller?
    const mandatoryProps = ['type', 'baudRate', 'channelSpacing', 'channelDeviation'];
    const res = { result: true, msg: 'invalid_modulation_properties' };
    for (let i = 0; i < mandatoryProps.length; i++) {
      const prop = mandatoryProps[i];
      if (!modulation.hasOwnProperty(prop)) {
        res.result = false;
        return res;
      }
    }
    if (modulation.type !== 'ASK' && modulation.type !== 'FSK' && modulation.type !== 'GFSK') {
      res.result = false;
      return res;
    }

    if (!_valid_bounds(modulation.baudRate, modulationBounds.baudRate.min, modulationBounds.baudRate.max)) {
      res.result = false;
      return res;
    }
    if (!_valid_bounds(modulation.channelSpacing, modulationBounds.channelSpacing.min, modulationBounds.channelSpacing.max)) {
      res.result = false;
      return res;
    }
    if (!_valid_bounds(modulation.channelDeviation, modulationBounds.channelDeviation.min, modulationBounds.channelDeviation.max)) {
      res.result = false;
      return res;
    }

    return res;
  },
};

const prontoValidator = {
  cmds(cmds, signal) {
    const res = !Object.keys(cmds).some(cmd => {
      return !_valid_pronto_string(cmds[cmd]);
    });
    return { result: res, msg: 'invalid_pronto_cmds' };
  },
  toggleCmds(cmds, signal) {
    const res = !Object.keys(cmds).some(cmd => {
      return !_valid_pronto_string(cmds[cmd]);
    });
    return { result: res, msg: 'invalid_pronto_toggleCmds' };
  },
  repetitions(repetitions, signal) {
    const res = _valid_bounds(repetitions, rfBounds.repetitions.min, rfBounds.repetitions.max);
    return { result: res, msg: 'repetitions_out_of_bounds' };
  },
};

const rf433Bounds = {
  carrier: { min: 433000000, max: 433990000 },
};

const rf433Validator = {
  carrier(carrier, signal) {
    const res = _valid_bounds(carrier, 433000000, 433990000);
    return { result: res, msg: 'carrier_out_of_bounds' };
  },
};

const rf868Bounds = {
  carrier: { min: 868000000, max: 868900000 },
};

const rf868Validator = {
  carrier(carrier, signal) {
    const res = _valid_bounds(carrier, rf868Bounds.carrier.min, rf868Bounds.carrier.max);
    return { result: res, msg: 'carrier_out_of_bounds' };
  },
};

const irBounds = {
  carrier: { min: 30000, max: 58000 },
  dutyCycle: { min: 30, max: 70 },
};

const irValidator = {
  carrier(carrier, signal) {
    const res = _valid_bounds(carrier, irBounds.carrier.min, irBounds.carrier.max);
    return { result: res, msg: 'invalid_carrier' };
  },
  dutyCycle(dutyCycle, signal) {
    const res = _valid_bounds(dutyCycle, irBounds.dutyCycle.min, irBounds.dutyCycle.max);
    return { result: res, msg: 'dutyCycle_out_of_bounds' };
  },
};

module.exports = {
  validate,
  genericValidator,
  irValidator,
  rfValidator,
  rf433Validator,
  rf868Validator,
  modulationValidator,
  prontoValidator,
};
