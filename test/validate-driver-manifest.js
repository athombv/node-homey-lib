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
      publish: /invalid image extention/i,
      verified: /invalid image extention/i,
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
});
