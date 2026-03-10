'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HomeyLib = require('..');

describe('Util.validateIntegrity', function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  const content = Buffer.from('hello world');
  let tmpDir;
  let filePath;

  beforeEach(async function() {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'homey-lib-'));
    filePath = path.join(tmpDir, 'sample.txt');
    await fs.promises.writeFile(filePath, content);
  });

  afterEach(async function() {
    await fs.promises.unlink(filePath).catch(() => {});
    await fs.promises.rmdir(tmpDir).catch(() => {});
  });

  it('returns true when the digest matches', async function() {
    const integrity = 'sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

    const result = await HomeyLib.Util.validateIntegrity(filePath, integrity);
    assert.strictEqual(result, true);
  });

  it('returns false when the digest does not match', async function() {
    const integrity = 'sha256:deadbeef';
    const result = await HomeyLib.Util.validateIntegrity(filePath, integrity);

    assert.strictEqual(result, false);
  });

  it('rejects invalid integrity formats', async function() {
    await assert.rejects(() => HomeyLib.Util.validateIntegrity(filePath, 'sha256'), /format/i);
  });
});

describe('Util.getIntegrity', function() {
  // eslint-disable-next-line mocha/no-setup-in-describe
  const content = Buffer.from('hello world');
  let tmpDir;
  let filePath;

  beforeEach(async function() {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'homey-lib-'));
    filePath = path.join(tmpDir, 'sample.txt');
    await fs.promises.writeFile(filePath, content);
  });

  afterEach(async function() {
    await fs.promises.unlink(filePath).catch(() => {});
    await fs.promises.rmdir(tmpDir).catch(() => {});
  });

  it('returns a sha256 integrity string', async function() {
    const expected = 'sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
    const actual = await HomeyLib.Util.getIntegrity(filePath, 'sha256');

    assert.strictEqual(actual, expected);
  });

  it('rejects disallowed algorithms', async function() {
    await assert.rejects(() => HomeyLib.Util.getIntegrity(filePath, 'md5'), /not allowed/i);
  });
});
