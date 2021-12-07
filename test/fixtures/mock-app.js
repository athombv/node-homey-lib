/* eslint-disable node/no-unpublished-require */

'use strict';

const path = require('path');
const assert = require('assert');

const mockFs = require('mock-fs');
const set = require('set-value');

const HomeyLib = require('../..');

const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x48, 0x44, 0x52,
]);

// TODO: do we want to test other image types?
// for now we assume that if png works, the other formats will too...
function createFakePng({ width, height }) {
  const size = Buffer.alloc(8);
  size.writeUInt32BE(width, 0);
  size.writeUInt32BE(height, 4);

  return Buffer.concat([PNG_HEADER, size]);
}

// This manifest is the minimum which is valid at all levels
const baseAppManifest = {
  id: 'test.app',
  name: { en: 'Test' },
  description: { en: 'Test app' },
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
  author: { name: 'Athom B.V.' },
  support: 'mailto:support@homey.app',
};

// This manifest is the minimum which is valid at all levels
const baseDriverManifest = {
  id: 'test',
  name: { en: 'Test' },
  class: 'light',
  capabilities: ['onoff'],
  platforms: ['local', 'cloud'],
  connectivity: ['cloud'],
  images: {
    small: '/drivers/test/assets/images/small.png',
    large: '/drivers/test/assets/images/large.png',
    xlarge: '/drivers/test/assets/images/xlarge.png',
  },
};

function mockApp(manifest, { files = {}, env = {} } = {}) {
  const appFs = {
    assets: {
      'icon.svg': '<svg></svg>',
      images: {
        'small.png': createFakePng({ width: 250, height: 175 }),
        'large.png': createFakePng({ width: 500, height: 350 }),
        'xlarge.png': createFakePng({ width: 1000, height: 700 }),
      },
    },
    drivers: {
      test: {
        assets: {
          images: {
            'small.png': createFakePng({ width: 75, height: 75 }),
            'large.png': createFakePng({ width: 500, height: 500 }),
            'xlarge.png': createFakePng({ width: 1000, height: 1000 }),
          },
        },
      },
    },
    'app.js': 'code',
    'app.json': JSON.stringify(manifest),
    'env.json': JSON.stringify(env),
    // node_modules ?
  };

  // Apply filesystem overrides
  for (const [key, value] of Object.entries(files)) {
    set(appFs, key, value);
  }

  mockFs({
    // create the fake app filesystem
    test_app: appFs,
    // ensure homey-lib can load its assets and dependencies
    assets: mockFs.load(path.resolve(__dirname, '../../assets')),
    node_modules: mockFs.load(path.resolve(__dirname, '../../node_modules')),
  });

  return new HomeyLib.App('test_app');
}

function clearMockApp() {
  mockFs.restore();
}

async function assertValidates(app, { debug, publish, verified }) {
  if (verified === true) {
    await assert.doesNotReject(() => app.validate({ level: 'verified' }), '`verified` validation');
  } else {
    await assert.rejects(() => app.validate({ level: 'verified' }), verified, '`verified` validation');
  }

  if (publish === true) {
    await assert.doesNotReject(() => app.validate({ level: 'publish' }), '`publish` validation');
  } else {
    await assert.rejects(() => app.validate({ level: 'publish' }), publish, '`publish` validation');
  }

  if (debug === true) {
    await assert.doesNotReject(() => app.validate({ level: 'debug' }), '`debug` validation');
  } else {
    await assert.rejects(() => app.validate({ level: 'debug' }), debug, '`debug` validation');
  }
}

module.exports = {
  mockApp,
  clearMockApp,
  assertValidates,
  createFakePng,
  baseAppManifest,
  baseDriverManifest,
};
