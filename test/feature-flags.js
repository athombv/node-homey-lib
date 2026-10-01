'use strict';

const assert = require('assert').strict;
const {
  FEATURE_BITS, decode, encode, fromKeys, hasFeature, merge, parseHeaders,
} = require('../lib/FeatureFlags');
const registry = require('../lib/FeatureFlags/registry.json');

describe('Feature flags', function() {
it('registry reserves two bytes for tests and contains unique names', function() {
  assert.deepEqual(registry.slice(0, 4), [
    'test.basic', 'test.rollout', 'test.compatibility', 'test.released',
  ]);
  assert.deepEqual(registry.slice(4, 16), Array(12).fill(null));
  const names = registry.filter(key => key !== null);
  assert.equal(new Set(names).size, names.length);
  assert.ok(registry.length <= 8192);
  for (const key of names) {
    assert.match(key, /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/);
    assert.ok(!key.startsWith('poc.'));
  }
});

it('canonical codec covers byte boundaries and the highest bit', function() {
  assert.equal(encode(Uint8Array.of(5, 0)), 'BQ');
  assert.equal(encode(fromKeys(['test.basic', 'test.compatibility'])), 'BQ');
  for (const [key, bit] of Object.entries(FEATURE_BITS)) {
    assert.equal(hasFeature(decode('BQ'), key), bit === 0 || bit === 2);
    assert.equal(hasFeature(decode(encode(fromKeys([key]))), key), true);
  }
  assert.equal(encode(new Uint8Array()), 'AA');
  for (const bit of [0, 2, 7, 8, 15, 16, 31, 32, 8191]) {
    const bytes = new Uint8Array(Math.floor(bit / 8) + 1);
    bytes[Math.floor(bit / 8)] = 1 << (bit % 8);
    assert.deepEqual(decode(encode(bytes)), bytes);
  }
  for (const value of ['', 'A', 'AB', 'AQ=', 'AQA', 'AA\n', '!', 'A'.repeat(1367)]) {
    assert.throws(() => decode(value));
  }
});

it('released features stay on while experimental features remain reversible', function() {
  const released = fromKeys(['test.released']);
  assert.equal(hasFeature(merge(decode('AA'), released), 'test.released'), true);
  assert.equal(hasFeature(decode('AA'), 'test.released'), false);
  assert.equal(hasFeature(released, 'toString'), false);
  assert.throws(() => fromKeys(['unknown.feature']));
});

it('missing or invalid feature headers fail closed', function() {
  assert.equal(hasFeature(parseHeaders({ get: () => 'AQ' }), 'test.basic'), true);
  for (const values of [
    {},
    { 'X-Homey-Features': '' },
    { 'X-Homey-Features': 'invalid!' },
  ]) {
    assert.equal(
      hasFeature(parseHeaders({ get: name => values[name] || null }), 'test.basic'),
      false,
    );
  }
});
});
