'use strict';

const HomeyLib = require('..');

describe('Capabilities', function () {
  const capabilities = {};

  before(function () {
    const allCapabilities = HomeyLib.getCapabilities();

    for (const [capabilityId, capability] of Object.entries(allCapabilities)) {
      // The original capabilities cannot be fixed if they contain errors, as that would break compatibility
      // with apps.
      if (capability.minCompatibility === undefined) continue;

      capabilities[capabilityId] = capability;
    }
  });

  // The mobile app will convert this to a 0-100 percentage slider. If the capability would have a
  // higher maximum, the slider would go to over 100%. For the capabilities we currently have, this doesn't make sense.
  it('Percentage capabilities are from 0-1 when settable', function () {
    const errors = [];

    for (const [capabilityId, capability] of Object.entries(capabilities)) {
      const unit = capability.units ? capability.units.en : undefined;

      if (capability.type === 'number' && unit === '%' && capability.setable) {
        if (!capability.decimals || capability.decimals < 2) {
          errors.push(`The capability ${capabilityId} should have at least 2 decimals`);
        }

        if (capability.min !== 0) {
          errors.push(`The capability ${capabilityId} should have a minimum of 0`);
        }

        if (capability.max !== 1) {
          errors.push(`The capability ${capabilityId} should have a maximum of 1`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  });

  // The mobile app will not convert this to a percentage slider, as it is not settable. It will show the value as is.
  it('Percentage capabilities are from 0-100 when not settable', function () {
    const errors = [];

    for (const [capabilityId, capability] of Object.entries(capabilities)) {
      const unit = capability.units ? capability.units.en : undefined;

      if (capability.type === 'number' && unit === '%' && !capability.setable && capability.getable) {
        if (capability.min !== 0) {
          errors.push(`The capability ${capabilityId} should have a minimum of 0`);
        }

        if (capability.max !== 100) {
          errors.push(`The capability ${capabilityId} should have a maximum of 100`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  });

  const defaultTriggerSuffix = {
    'boolean': ['_true', '_false'],
    'number': ['_changed'],
    'string': ['_changed'],
    'enum': ['_changed'],
  };

  // Homey Core will have default handlers for these triggers if they are named correctly.
  it('Trigger capabilities with a default suffix are valid', function () {
    const capabilities = HomeyLib.getCapabilities();

    const errors = [];

    for (const [capabilityId, capability] of Object.entries(capabilities)) {
      if (!capability.$flow || !capability.$flow.triggers) {
        continue;
      }

      for (const flow of capability.$flow.triggers) {
        const defaultSuffixes = defaultTriggerSuffix[capability.type] ? defaultTriggerSuffix[capability.type] : [];
        for (const suffix of defaultSuffixes) {
          if (!flow.id.endsWith(suffix)) {
            continue;
          }

          const requiredId = capabilityId + suffix;

          if (flow.id !== requiredId) {
            errors.push(`The trigger ${flow.id} should be named ${requiredId}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  });
});