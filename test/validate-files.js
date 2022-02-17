/* eslint-disable node/no-unpublished-require */

'use strict';

const {
  mockApp,
  clearMockApp,
  assertValidates,
  createFakePng,
  baseAppManifest,
  baseDriverManifest,
} = require('./fixtures/mock-app');

const HomeyLib = require('..');

describe('HomeyLib.App#validate() files', function() {
  this.slow(500);

  afterEach(function() {
    clearMockApp();
  });

  it('can validate a minimal app manifest for debug', async function() {
    const app = mockApp({
      id: 'test.app',
      name: { en: 'Test' },
      version: '1.0.0',
      sdk: 3,
      compatibility: '>=5.0.0',
      author: {
        name: 'Athom B.V.',
        email: 'info@athom.com',
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: /property `category` is required/i,
      verified: /property `platforms` is required/i,
    });
  });

  it('can validate a minimal app manifest for publish', async function() {
    const app = mockApp({
      id: 'test.app',
      name: { en: 'Test' },
      // description: { en: 'Test app' }, // TODO: should this be required?
      brandColor: '#000000',
      version: '1.0.0',
      sdk: 3,
      compatibility: '>=5.0.0',
      category: ['tools'],
      images: {
        small: '/assets/images/small.png',
        large: '/assets/images/large.png',
        xlarge: '/assets/images/xlarge.png',
      },
      author: {
        name: 'Athom B.V.',
        email: 'info@athom.com',
      },
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: /property `platforms` is required/i,
    });
  });

  it('can validate a minimal app manifest for verified', async function() {
    const app = mockApp({
      id: 'test.app',
      name: { en: 'Test' },
      // description: { en: 'Test app' }, // TODO: should this be required?
      brandColor: '#000000',
      version: '1.0.0',
      sdk: 3,
      compatibility: '>=5.0.0',
      platforms: ['local', 'cloud'],
      category: ['tools'],
      images: {
        small: '/assets/images/small.png',
        large: '/assets/images/large.png',
        xlarge: '/assets/images/xlarge.png',
      },
      author: {
        name: 'Athom B.V.',
        email: 'info@athom.com',
      },
      support: 'mailto:support@homey.app',
    });

    await assertValidates(app, {
      debug: true,
      publish: true,
      verified: true,
    });
  });

  /*
   * App Icon
   */

  it('assets/icon.svg needs to exist', async function() {
    const app = mockApp(baseAppManifest, {
      files: {
        'assets.icon\\.svg': undefined,
      },
    });

    await assertValidates(app, {
      debug: /filepath does not exist/i,
      publish: /filepath does not exist/i,
      verified: /filepath does not exist/i,
    });
  });

  /*
   * App Images
   */

  it('/assets/images/*.png should be valid images', async function() {
    const app = mockApp({
      ...baseAppManifest,
      images: {
        small: '/assets/images/small.png',
        large: '/assets/images/large.png',
        xlarge: '/assets/images/xlarge.png',
      },
    }, {
      files: {
        'assets.images.small\\.png': undefined,
        'assets.images.large\\.png': undefined,
        'assets.images.xlarge\\.png': undefined,
      },
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /filepath does not exist/i,
      verified: /filepath does not exist/i,
    });
  });

  it('/assets/images/*.png should have the correct size', async function() {
    const app = mockApp({
      ...baseAppManifest,
      images: {
        small: '/assets/images/small.png',
        large: '/assets/images/large.png',
        xlarge: '/assets/images/xlarge.png',
      },
    }, {
      files: {
        'assets.images.small\\.png': createFakePng({ width: 0, height: 0 }),
        'assets.images.large\\.png': createFakePng({ width: 0, height: 0 }),
        'assets.images.xlarge\\.png': createFakePng({ width: 0, height: 0 }),
      },
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /invalid image size/i,
      verified: /invalid image size/i,
    });
  });

  /*
   * Driver Images
   */

  it('drivers/test/assets/images/*.png should be valid images', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        images: {
          small: 'drivers/test/assets/images/small.png',
          large: 'drivers/test/assets/images/large.png',
          xlarge: 'drivers/test/assets/images/xlarge.png',
        },
      }],
    }, {
      files: {
        'drivers.test.assets.images.small\\.png': undefined,
        'drivers.test.assets.images.large\\.png': undefined,
        'drivers.test.assets.images.xlarge\\.png': undefined,
      },
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /filepath does not exist/i,
      verified: /filepath does not exist/i,
    });
  });

  it('drivers/test/assets/images/*.png should have the correct size', async function() {
    const app = mockApp({
      ...baseAppManifest,
      drivers: [{
        ...baseDriverManifest,
        images: {
          small: 'drivers/test/assets/images/small.png',
          large: 'drivers/test/assets/images/large.png',
          xlarge: 'drivers/test/assets/images/xlarge.png',
        },
      }],
    }, {
      files: {
        'drivers.test.assets.images.small\\.png': createFakePng({ width: 0, height: 0 }),
        'drivers.test.assets.images.large\\.png': createFakePng({ width: 0, height: 0 }),
        'drivers.test.assets.images.xlarge\\.png': createFakePng({ width: 0, height: 0 }),
      },
    });

    await assertValidates(app, {
      debug: true, // debug does not validate images
      publish: /invalid image size/i,
      verified: /invalid image size/i,
    });
  });

  /*
   * App Env
   */

  it('/env.json can only contain uppercase properties', async function() {
    const app = mockApp(baseAppManifest, {
      env: { test: 'abc' },
    });

    await assertValidates(app, {
      debug: /invalid \/env\.json key/i,
      publish: /invalid \/env\.json key/i,
      verified: /invalid \/env\.json key/i,
    });
  });

  it('env.json can only contain string values', async function() {
    const app = mockApp(baseAppManifest, {
      env: { TEST: 1 },
    });

    await assertValidates(app, {
      debug: /invalid \/env\.json value/i,
      publish: /invalid \/env\.json value/i,
      verified: /invalid \/env\.json value/i,
    });
  });

  /*
   * Test Test Cleanup
   */

  it('fails when an app does not exist', async function() {
    // This tests that the mock is reset correctly (that makes sure our other tests are reliable)
    const app = new HomeyLib.App('test_app');

    await assertValidates(app, {
      debug: /no such file or directory/i,
      publish: /no such file or directory/i,
      verified: /no such file or directory/i,
    });
  });
});
