/* eslint-disable node/no-unpublished-require */

'use strict';

const {
  mockApp,
  clearMockApp,
  assertValidates,
  baseAppManifest,
  baseDriverManifest,
} = require('./fixtures/mock-app');

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
});
