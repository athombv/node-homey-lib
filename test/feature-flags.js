'use strict';

const assert = require('assert').strict;
const {
  FEATURE_BITS, HomeyFeature, decode, encode, fromKeys, hasFeature, merge, parseHeaders,
} = require('../lib/FeatureFlags');
const registry = require('../lib/FeatureFlags/registry.json');

it('registry keeps published assignments and contains unique names and bits', function() {
  // Published assignments are permanent; only append new entries.
  for (const [key, bit] of Object.entries({
    'poc.homey-feature': 0,
    'poc.energy-new-experience': 1,
    'poc.flow-editor': 2,
    'poc.device-insights': 3,
  })) assert.equal(FEATURE_BITS[key], bit);
  const entries = Object.values(registry);
  assert.equal(new Set(entries.map(({ key }) => key)).size, entries.length);
  assert.equal(new Set(entries.map(({ bit }) => bit)).size, entries.length);
  for (const { key, bit } of entries) {
    assert.match(key, /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/);
    assert.ok(Number.isSafeInteger(bit) && bit >= 0 && bit <= 8191);
  }
});

it('canonical codec covers byte boundaries and the highest bit', function() {
  assert.equal(encode(Uint8Array.of(5, 0)), 'BQ');
  assert.equal(encode(fromKeys([HomeyFeature.POC_HOMEY_FEATURE, HomeyFeature.POC_FLOW_EDITOR])), 'BQ');
  for (const { key, bit } of Object.values(registry)) {
    assert.equal(hasFeature(decode('BQ'), key), bit === 0 || bit === 2);
    assert.equal(hasFeature(decode(encode(fromKeys([key]))), key), true);
  }
  assert.equal(encode(new Uint8Array()), 'AA');
  for (const bit of [0, 2, 7, 8, 31, 32, 8191]) {
    const bytes = new Uint8Array(Math.floor(bit / 8) + 1);
    bytes[Math.floor(bit / 8)] = 1 << (bit % 8);
    assert.deepEqual(decode(encode(bytes)), bytes);
  }
  for (const value of ['', 'A', 'AB', 'AQ=', 'AQA', 'AA\n', '!', 'A'.repeat(1367)]) {
    assert.throws(() => decode(value));
  }
});

it('released features stay on while experimental features remain reversible', function() {
  const released = fromKeys([HomeyFeature.POC_HOMEY_FEATURE]);
  assert.equal(hasFeature(merge(decode('AA'), released), HomeyFeature.POC_HOMEY_FEATURE), true);
  assert.equal(hasFeature(decode('AA'), HomeyFeature.POC_HOMEY_FEATURE), false);
  assert.equal(hasFeature(released, 'toString'), false);
  assert.throws(() => fromKeys(['unknown.feature']));
});

it('invalid or unknown headers fail closed', function() {
  for (const values of [
    {},
    { 'X-Homey-Features-Version': '2' },
    {
      'X-Homey-Features-Version': '1',
      'X-Homey-Features-Revision': '-1',
      'X-Homey-Features': 'AQ',
    },
  ]) {
    assert.equal(
      hasFeature(parseHeaders({ get: name => values[name] || null }).features, HomeyFeature.POC_HOMEY_FEATURE),
      false,
    );
  }
});
