'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HomeyLib = require('..');

const {
  OTA_FILE_IDENTIFIER,
  OTA_HEADER_VERSION,
  OTA_HEADER_LENGTH,
  buildOtaHeader,
} = require('./fixtures/zigbee-ota');

describe('Util Zigbee OTA header helpers', function() {
  let tmpDir;
  let filePath;

  afterEach(async function() {
    if (filePath) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
    if (tmpDir) {
      await fs.promises.rmdir(tmpDir).catch(() => {});
    }
    filePath = undefined;
    tmpDir = undefined;
  });

  it('parses a minimal OTA header', async function() {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'homey-lib-'));
    filePath = path.join(tmpDir, 'ota.bin');

    const payload = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    const totalImageSize = OTA_HEADER_LENGTH + payload.length;
    const header = buildOtaHeader({ totalImageSize });

    await fs.promises.writeFile(filePath, Buffer.concat([header, payload]));

    const parsed = await HomeyLib.Util.parseZigbeeOTAHeader(filePath);

    assert.strictEqual(parsed.fileIdentifier, OTA_FILE_IDENTIFIER);
    assert.strictEqual(parsed.headerVersion, OTA_HEADER_VERSION);
    assert.strictEqual(parsed.headerLength, OTA_HEADER_LENGTH);
    assert.strictEqual(parsed.manufacturerCode, 0x1234);
    assert.strictEqual(parsed.imageType, 0x5678);
    assert.strictEqual(parsed.fileVersion, 0x01020304);
    assert.strictEqual(parsed.totalImageSize, totalImageSize);
  });

  it('validates expected OTA header values', async function() {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'homey-lib-'));
    filePath = path.join(tmpDir, 'ota.bin');

    const payload = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const totalImageSize = OTA_HEADER_LENGTH + payload.length;
    const header = buildOtaHeader({ totalImageSize });

    await fs.promises.writeFile(filePath, Buffer.concat([header, payload]));

    const parsed = await HomeyLib.Util.validateZigbeeOTAHeader({
      filePath,
      manufacturerCode: 0x1234,
      imageType: 0x5678,
      fileVersion: 0x01020304,
    });

    assert.strictEqual(parsed.manufacturerCode, 0x1234);
  });

  it('rejects an invalid OTA header identifier', async function() {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'homey-lib-'));
    filePath = path.join(tmpDir, 'ota.bin');

    const payload = Buffer.from([0xaa, 0xbb, 0xcc]);
    const totalImageSize = OTA_HEADER_LENGTH + payload.length;
    const header = buildOtaHeader({
      fileIdentifier: 0xDEADBEEF,
      totalImageSize,
    });

    await fs.promises.writeFile(filePath, Buffer.concat([header, payload]));

    await assert.rejects(
      () => HomeyLib.Util.validateZigbeeOTAHeader({ filePath }),
      /identifier/i,
    );
  });
});
