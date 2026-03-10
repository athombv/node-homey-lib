/* eslint-disable node/no-unpublished-require */

'use strict';

const crypto = require('crypto');

const {
  mockApp,
  clearMockApp,
  assertValidates,
  baseAppManifest,
  baseDriverManifest,
  createFakePng,
} = require('./fixtures/mock-app');
const { Capability } = require('../index');

const {
  OTA_HEADER_LENGTH,
  buildOtaHeader,
} = require('./fixtures/zigbee-ota');

function createZigbeeOtaFileBuffer(options = {}) {
  const payload = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
  const totalImageSize = OTA_HEADER_LENGTH + payload.length;
  const header = buildOtaHeader({ totalImageSize, ...options });
  return Buffer.concat([header, payload]);
}

function createIntegrity(buffer, hashName = 'sha256') {
  const digest = crypto.createHash(hashName).update(buffer).digest('hex');
  return `${hashName}:${digest}`;
}

describe('HomeyLib.App#validate() driver manifest', function() {
  this.slow(500);

  afterEach(function() {
    clearMockApp();
  });

  /*
   * Driver ID
   */

  it('`id` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        id: undefined,
      }],
    });

    await assertValidates(app, {
      debug: /should have required property 'id'/i,
      publish: /should have required property 'id'/i,
      verified: /should have required property 'id'/i,
    });
  });

  /*
   * Driver Capabilities
   */

  it('`capabilities` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        capabilities: undefined,
      }],
    });

    await assertValidates(app, {
      debug: /should have required property 'capabilities'/i,
      publish: /should have required property 'capabilities'/i,
      verified: /should have required property 'capabilities'/i,
    });
  });

  it('`capabilities` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['test'],
      }],
    });

    await assertValidates(app, {
      debug: /drivers\.test invalid capability/i,
      publish: /drivers\.test invalid capability/i,
      verified: /drivers\.test invalid capability/i,
    });
  });

  it('`capabilities` needs to be valid (with sub-capabilities)', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['test.one'],
      }],
    });

    await assertValidates(app, {
      debug: /drivers\.test invalid capability/i,
      publish: /drivers\.test invalid capability/i,
      verified: /drivers\.test invalid capability/i,
    });
  });

  it('`capabilities` custom capabilities are validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['test'],
      }],
      capabilities: {
        test: {
          type: 'boolean',
          title: 'Test capability',
          getable: true,
          setable: true,
        },
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`capabilities` custom sub-capabilities are validated', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['test.one', 'test.two'],
      }],
      capabilities: {
        test: {
          type: 'boolean',
          title: 'Test capability',
          getable: true,
          setable: true,
        },
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  /*
   * Driver Images
   */

  it('`images` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        images: undefined,
      }],
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /property `images` is required/i,
      verified: /property `images` is required/i,
    });
  });

  it('`images` need to be a known format', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        images: {
          small: '/assets/images/small.webp',
          large: '/assets/images/large.webp',
          xlarge: '/assets/images/xlarge.webp',
        },
      }],
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /invalid image extension/i,
      verified: /invalid image extension/i,
    });
  });

  /*
   * Driver Platforms
   */

  it('`platforms` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        platforms: undefined,
      }],
    });

    await assertValidates(app, {
      debug: true, // platforms is optional for debug, but will warn
      publish: true, // platforms is optional for publish, but will warn
      verified: /property `platforms` is required/i,
    });
  });

  it('`platforms` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        platforms: ['none'],
      }],
    });

    await assertValidates(app, {
      debug: /platforms\[0\] should be equal to one of the allowed values/i,
      publish: /platforms\[0\] should be equal to one of the allowed values/i,
      verified: /platforms\[0\] should be equal to one of the allowed values/i,
    });
  });

  /*
   * Driver Connectivity
   */

  it('`connectivity` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        connectivity: undefined,
      }],
    });

    await assertValidates(app, {
      debug: true, // connectivity is optional for debug
      publish: true, // connectivity is optional for publish
      verified: /property `connectivity` is required/i,
    });
  });

  it('`connectivity` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        connectivity: ['none'],
      }],
    });

    await assertValidates(app, {
      debug: /connectivity\[0\] should be equal to one of the allowed values/i,
      publish: /connectivity\[0\] should be equal to one of the allowed values/i,
      verified: /connectivity\[0\] should be equal to one of the allowed values/i,
    });
  });

  it('`class` needs to be checked for compatibility', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        class: 'shutterblinds', // Device class that requires compatibility >= 12
      }],
    });

    await assertValidates(app, {
      debug: /driver class: shutterblinds is not available for compatibility/i,
      publish: /driver class: shutterblinds is not available for compatibility/i,
      verified: /driver class: shutterblinds is not available for compatibility/i,
    });
  });

  it('`class` without compatibility should validate', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        class: 'light', // Device class that requires no min compatibility
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`capabilities` needs to be checked for compatibility', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=5.0.0 <=12.0.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['alarm_pm01'], // Capability that requires compatibility >= 12.1
      }],
    });

    await assertValidates(app, {
      debug: /capability: alarm_pm01 is not available for compatibility/i,
      publish: /capability: alarm_pm01 is not available for compatibility/i,
      verified: /capability: alarm_pm01 is not available for compatibility/i,
    });
  });

  it('`capabilities` without compatibility should validate', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['onoff'], // Capability that has no min compatibility
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  /*
   * Zigbee Driver
   */

  it('`zigbee.productId` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          manufacturerName: ['dummyManufacturer'],
          endpoints: {},
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee should have required property 'productId'/i,
      publish: /zigbee should have required property 'productId'/i,
      verified: /zigbee should have required property 'productId'/i,
    });
  });

  it('`zigbee.productId` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: true,
          manufacturerName: ['dummyManufacturer'],
          endpoints: {},
        },
      }],
    });

    // Product ID can be a string
    await assertValidates(app, {
      debug: /zigbee\.productId should be string/i,
      publish: /zigbee\.productId should be string/i,
      verified: /zigbee\.productId should be string/i,
    });

    // or an array of strings
    await assertValidates(app, {
      debug: /zigbee\.productId should be array/i,
      publish: /zigbee\.productId should be array/i,
      verified: /zigbee\.productId should be array/i,
    });
  });

  it('`zigbee.manufacturerName` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          endpoints: {},
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee should have required property 'manufacturerName'/i,
      publish: /zigbee should have required property 'manufacturerName'/i,
      verified: /zigbee should have required property 'manufacturerName'/i,
    });
  });

  it('`zigbee.manufacturerName` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: 'dummyProduct',
          manufacturerName: true,
          endpoints: {},
        },
      }],
    });

    // manufacturerName can be a string
    await assertValidates(app, {
      debug: /zigbee\.manufacturerName should be string/i,
      publish: /zigbee\.manufacturerName should be string/i,
      verified: /zigbee\.manufacturerName should be string/i,
    });

    // or an array of strings
    await assertValidates(app, {
      debug: /zigbee\.manufacturerName should be array/i,
      publish: /zigbee\.manufacturerName should be array/i,
      verified: /zigbee\.manufacturerName should be array/i,
    });
  });

  it('`zigbee.endpoints` needs to be defined', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: 'dummyManufacturer',
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee should have required property 'endpoints'/i,
      publish: /zigbee should have required property 'endpoints'/i,
      verified: /zigbee should have required property 'endpoints'/i,
    });
  });

  it('`zigbee.endpoints` needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: true,
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints should be object/i,
      publish: /zigbee\.endpoints should be object/i,
      verified: /zigbee\.endpoints should be object/i,
    });
  });

  it('`zigbee.endpoints` key needs to be valid', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {
            bla: [],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints should match pattern/i,
      publish: /zigbee\.endpoints should match pattern/i,
      verified: /zigbee\.endpoints should match pattern/i,
    });
  });

  it('`zigbee.endpoints.x` needs to be an object', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {
            1: [],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints\['1'] should be object/i,
      publish: /zigbee\.endpoints\['1'] should be object/i,
      verified: /zigbee\.endpoints\['1'] should be object/i,
    });
  });

  it('`zigbee.endpoints.x.clusters` needs to be an array', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {
            1: {
              clusters: {},
            },
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints\['1'].clusters should be array/i,
      publish: /zigbee\.endpoints\['1'].clusters should be array/i,
      verified: /zigbee\.endpoints\['1'].clusters should be array/i,
    });
  });

  it('`zigbee.endpoints.x.clusters` needs to be an array of only numbers', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {
            1: {
              clusters: [true],
            },
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints\['1'].clusters\[0] should be number/i,
      publish: /zigbee\.endpoints\['1'].clusters\[0] should be number/i,
      verified: /zigbee\.endpoints\['1'].clusters\[0] should be number/i,
    });
  });

  it('`zigbee.endpoints.x.bindings` needs to be an array', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {
            1: {
              bindings: {},
            },
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints\['1'].bindings should be array/i,
      publish: /zigbee\.endpoints\['1'].bindings should be array/i,
      verified: /zigbee\.endpoints\['1'].bindings should be array/i,
    });
  });

  it('`zigbee.endpoints.x.bindings` needs to be an array of only numbers', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {
            1: {
              bindings: [true],
            },
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /zigbee\.endpoints\['1'].bindings\[0] should be number/i,
      publish: /zigbee\.endpoints\['1'].bindings\[0] should be number/i,
      verified: /zigbee\.endpoints\['1'].bindings\[0] should be number/i,
    });
  });

  /*
   * target_power_mode values validation
   */

  it('`target_power_mode` with custom values should pass', async function() {
    const canonicalValues = Capability.getCapability('target_power_mode').values;
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power', 'target_power_mode'],
        capabilitiesOptions: {
          target_power_mode: {
            values: [
              ...canonicalValues,
              { id: 'custom', title: { en: 'Custom' } },
            ],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`target_power_mode` should fail when canonical value `device` is missing', async function() {
    const canonicalValues = Capability.getCapability('target_power_mode').values;
    const homeyValue = canonicalValues.find(v => v.id === 'homey');
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power', 'target_power_mode'],
        capabilitiesOptions: {
          target_power_mode: {
            values: [
              homeyValue,
              { id: 'custom', title: { en: 'Custom' } },
            ],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /\.values must include canonical value "device"/i,
      publish: /\.values must include canonical value "device"/i,
      verified: /\.values must include canonical value "device"/i,
    });
  });

  it('`target_power_mode` should fail when canonical value `homey` is missing', async function() {
    const canonicalValues = Capability.getCapability('target_power_mode').values;
    const deviceValue = canonicalValues.find(v => v.id === 'device');
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power', 'target_power_mode'],
        capabilitiesOptions: {
          target_power_mode: {
            values: [
              deviceValue,
              { id: 'custom', title: { en: 'Custom' } },
            ],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /\.values must include canonical value "homey"/i,
      publish: /\.values must include canonical value "homey"/i,
      verified: /\.values must include canonical value "homey"/i,
    });
  });

  it('`target_power_mode` with custom titles for canonical values should pass', async function() {
    const canonicalValues = Capability.getCapability('target_power_mode').values;
    const homeyValue = canonicalValues.find(v => v.id === 'homey');
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power', 'target_power_mode'],
        capabilitiesOptions: {
          target_power_mode: {
            values: [
              { id: 'device', title: { en: 'Custom Device Title' } },
              homeyValue,
            ],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`target_power_mode` without values array should pass', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power', 'target_power_mode'],
        capabilitiesOptions: {
          target_power_mode: {
            title: { en: 'Power Mode' },
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`target_power_mode` with reserved prefix homey_ should fail', async function() {
    const canonicalValues = Capability.getCapability('target_power_mode').values;
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power', 'target_power_mode'],
        capabilitiesOptions: {
          target_power_mode: {
            values: [
              ...canonicalValues,
              { id: 'homey_auto', title: { en: 'Homey Auto' } },
            ],
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /reserved prefix/i,
      publish: /reserved prefix/i,
      verified: /reserved prefix/i,
    });
  });

  /*
   * target_power exclude validation
   */

  it('`target_power` exclude must include 0 (excludeMin > 0 should fail)', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            excludeMin: 100, excludeMax: 1380, // Invalid: excludeMin > 0
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /capabilitiesOptions\.target_power\.excludeMin\/excludeMax must include 0/i,
      publish: /capabilitiesOptions\.target_power\.excludeMin\/excludeMax must include 0/i,
      verified: /capabilitiesOptions\.target_power\.excludeMin\/excludeMax must include 0/i,
    });
  });

  it('`target_power` exclude must include 0 (excludeMax < 0 should fail)', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            excludeMin: -1380, excludeMax: -100, // Invalid: excludeMax < 0
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /capabilitiesOptions\.target_power\.excludeMin\/excludeMax must include 0/i,
      publish: /capabilitiesOptions\.target_power\.excludeMin\/excludeMax must include 0/i,
      verified: /capabilitiesOptions\.target_power\.excludeMin\/excludeMax must include 0/i,
    });
  });

  it('`target_power` valid exclude that includes 0 should pass', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            excludeMin: 0, // Valid: includes 0
            excludeMax: 1380,
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`target_power` valid bidirectional exclude should pass', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            min: -11000,
            max: 22000,
            excludeMin: -1380,
            excludeMax: 1380, // Valid: symmetric around 0
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  it('`target_power` without excludeMin/excludeMax should pass', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            min: -5000,
            max: 5000,
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  /*
   * target_power min/max validation (all devices)
   */

  it('`target_power` min/max must include 0 (min > 0 should fail)', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            min: 100, // Invalid: min > 0
            max: 5000,
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /capabilitiesOptions\.target_power\.min\/max must include 0/i,
      publish: /capabilitiesOptions\.target_power\.min\/max must include 0/i,
      verified: /capabilitiesOptions\.target_power\.min\/max must include 0/i,
    });
  });

  it('`target_power` min/max must include 0 (max < 0 should fail)', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            min: -5000,
            max: -100, // Invalid: max < 0
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: /capabilitiesOptions\.target_power\.min\/max must include 0/i,
      publish: /capabilitiesOptions\.target_power\.min\/max must include 0/i,
      verified: /capabilitiesOptions\.target_power\.min\/max must include 0/i,
    });
  });

  it('`target_power` valid min/max that includes 0 should pass', async function() {
    const app = mockApp({
      ...baseAppManifest,
      compatibility: '>=12.13.0',
      drivers: [{
        ...baseDriverManifest,
        capabilities: ['target_power'],
        capabilitiesOptions: {
          target_power: {
            min: -5000,
            max: 5000, // Valid: includes 0
          },
        },
      }],
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  /*
   * Zigbee Firmware Updates
   */

  it('`firmwareUpdates.updates[].files` needs at least one entry', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: 'dummyProduct',
          manufacturerName: 'dummyManufacturer',
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'dummyManufacturer', productId: 'dummyProduct' },
            files: [],
          }],
        },
      }],
    });

    await assertValidates(app, {
      debug: /firmwareUpdates.updates\[0\].files should NOT have fewer than 1 items/i,
      publish: /firmwareUpdates.updates\[0\].files should NOT have fewer than 1 items/i,
      verified: /firmwareUpdates.updates\[0\].files should NOT have fewer than 1 items/i,
    });
  });

  it('`firmwareUpdates.updates[].device` is mandatory', async function() {
    const otaBuffer = createZigbeeOtaFileBuffer();
    const integrity = createIntegrity(otaBuffer);

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: 'dummyProduct',
          manufacturerName: 'dummyManufacturer',
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            files: [{
              name: 'ota.bin',
              integrity,
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x1234,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: /firmwareUpdates\.updates\[0\] should have required property 'device'/i,
      publish: /firmwareUpdates\.updates\[0\] should have required property 'device'/i,
      verified: /firmwareUpdates\.updates\[0\] should have required property 'device'/i,
    });
  });

  it('`firmwareUpdates` validates that update.device.manufacturerName matches the Zigbee driver', async function() {
    const otaBuffer = createZigbeeOtaFileBuffer();
    const integrity = createIntegrity(otaBuffer);

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'otherManufacturer', productId: 'dummyProduct' },
            files: [{
              name: 'ota.bin',
              integrity,
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x1234,
              size: otaBuffer.length,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              images: {
                'small.png': createFakePng({ width: 75, height: 75 }),
                'large.png': createFakePng({ width: 500, height: 500 }),
                'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
              },
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: /drivers\.test\.firmwareUpdates\.updates\[0\] has a manufacturerName that does not match the driver zigbee\.manufacturerName/i,
      publish: /drivers\.test firmwareUpdates can only be included in debug mode validation./i,
      verified: /drivers\.test firmwareUpdates can only be included in debug mode validation./i,
    });
  });

  it('`firmwareUpdates` validates that update.device.productId matches the Zigbee driver', async function() {
    const otaBuffer = createZigbeeOtaFileBuffer();
    const integrity = createIntegrity(otaBuffer);

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: ['dummyProduct'],
          manufacturerName: ['dummyManufacturer'],
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'dummyManufacturer', productId: 'otherProduct' },
            files: [{
              name: 'ota.bin',
              integrity,
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x1234,
              size: otaBuffer.length,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              images: {
                'small.png': createFakePng({ width: 75, height: 75 }),
                'large.png': createFakePng({ width: 500, height: 500 }),
                'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
              },
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: /drivers\.test\.firmwareUpdates\.updates\[0\] has a productId that does not match the driver zigbee\.productId/i,
      publish: /drivers\.test firmwareUpdates can only be included in debug mode validation./i,
      verified: /drivers\.test firmwareUpdates can only be included in debug mode validation./i,
    });
  });

  it('`firmwareUpdates` validates integrity', async function() {
    const otaBuffer = createZigbeeOtaFileBuffer();

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: 'dummyProduct',
          manufacturerName: 'dummyManufacturer',
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'dummyManufacturer', productId: 'dummyProduct' },
            files: [{
              name: 'ota.bin',
              integrity: 'sha256:deadbeef',
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x1234,
              size: otaBuffer.length,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              images: {
                'small.png': createFakePng({ width: 75, height: 75 }),
                'large.png': createFakePng({ width: 500, height: 500 }),
                'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
              },
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: /drivers.test.firmwareUpdates.updates\[0\].files\[0\] integrity mismatch/i,
      publish: /drivers.test firmwareUpdates can only be included in debug mode validation./i,
      verified: /drivers.test firmwareUpdates can only be included in debug mode validation./i,
    });
  });

  it('`firmwareUpdates` validates OTA header manufacturerCode', async function() {
    const otaBuffer = createZigbeeOtaFileBuffer({ manufacturerCode: 0x1234 });
    const integrity = createIntegrity(otaBuffer);

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: 'dummyProduct',
          manufacturerName: 'dummyManufacturer',
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'dummyManufacturer', productId: 'dummyProduct' },
            files: [{
              name: 'ota.bin',
              integrity,
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x9999,
              size: otaBuffer.length,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              images: {
                'small.png': createFakePng({ width: 75, height: 75 }),
                'large.png': createFakePng({ width: 500, height: 500 }),
                'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
              },
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: /invalid Zigbee OTA header/i,
      publish: /drivers.test firmwareUpdates can only be included in debug mode validation./i,
      verified: /drivers.test firmwareUpdates can only be included in debug mode validation./i,
    });
  });

  it('`firmwareUpdates` validates when OTA metadata matches', async function() {
    const otaBuffer = createZigbeeOtaFileBuffer({
      manufacturerCode: 0x1234,
      imageType: 0x5678,
      fileVersion: 0x01020304,
    });
    const integrity = createIntegrity(otaBuffer);

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        zigbee: {
          productId: 'dummyProduct',
          manufacturerName: 'dummyManufacturer',
          endpoints: {},
        },
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'dummyManufacturer', productId: 'dummyProduct' },
            files: [{
              name: 'ota.bin',
              integrity,
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x1234,
              size: otaBuffer.length,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              images: {
                'small.png': createFakePng({ width: 75, height: 75 }),
                'large.png': createFakePng({ width: 500, height: 500 }),
                'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
              },
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: /drivers.test firmwareUpdates can only be included in debug mode validation./i,
      verified: /drivers.test firmwareUpdates can only be included in debug mode validation./i,
    });
  });

  it('`firmwareUpdates` only allowed on drivers with zigbee property', async function () {
    const otaBuffer = createZigbeeOtaFileBuffer({
      manufacturerCode: 0x1234,
      imageType: 0x5678,
      fileVersion: 0x01020304,
    });
    const integrity = createIntegrity(otaBuffer);

    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        firmwareUpdates: {
          updates: [{
            changelog: { en: 'Initial' },
            device: { manufacturerName: 'dummyManufacturer', productId: 'dummyProduct' },
            files: [{
              name: 'ota.bin',
              integrity,
              fileVersion: 0x01020304,
              imageType: 0x5678,
              manufacturerCode: 0x1234,
              size: otaBuffer.length,
            }],
          }],
        },
      }],
    }, {
      files: {
        drivers: {
          test: {
            assets: {
              images: {
                'small.png': createFakePng({ width: 75, height: 75 }),
                'large.png': createFakePng({ width: 500, height: 500 }),
                'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
              },
              firmware: {
                'ota.bin': otaBuffer,
              },
            },
          },
        },
      },
    });

    await assertValidates(app, {
      debug: /firmwareUpdates are only supported for Zigbee drivers/i,
      publish: /drivers\.test firmwareUpdates can only be included in debug mode validation./i,
      verified: /drivers\.test firmwareUpdates can only be included in debug mode validation./i,
    });
  });
});
