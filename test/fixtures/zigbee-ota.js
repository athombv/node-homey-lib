'use strict';

const OTA_FILE_IDENTIFIER = 0x0BEEF11E;
const OTA_HEADER_VERSION = 0x0100;
const OTA_HEADER_LENGTH = 56;

function buildOtaHeader({
  fileIdentifier = OTA_FILE_IDENTIFIER,
  headerVersion = OTA_HEADER_VERSION,
  manufacturerCode = 0x1234,
  imageType = 0x5678,
  fileVersion = 0x01020304,
  zigbeeStackVersion = 0x0002,
  headerString = 'Test OTA',
  totalImageSize,
  fieldControl = 0x0000,
}) {
  const buffer = Buffer.alloc(OTA_HEADER_LENGTH);
  let offset = 0;

  buffer.writeUInt32LE(fileIdentifier, offset);
  offset += 4;
  buffer.writeUInt16LE(headerVersion, offset);
  offset += 2;
  buffer.writeUInt16LE(OTA_HEADER_LENGTH, offset);
  offset += 2;
  buffer.writeUInt16LE(fieldControl, offset);
  offset += 2;
  buffer.writeUInt16LE(manufacturerCode, offset);
  offset += 2;
  buffer.writeUInt16LE(imageType, offset);
  offset += 2;
  buffer.writeUInt32LE(fileVersion, offset);
  offset += 4;
  buffer.writeUInt16LE(zigbeeStackVersion, offset);
  offset += 2;

  const headerStringBuffer = Buffer.alloc(32);
  headerStringBuffer.write(headerString, 0, 'ascii');
  headerStringBuffer.copy(buffer, offset);
  offset += 32;

  buffer.writeUInt32LE(totalImageSize, offset);

  return buffer;
}

module.exports = {
  OTA_FILE_IDENTIFIER,
  OTA_HEADER_VERSION,
  OTA_HEADER_LENGTH,
  buildOtaHeader,
};
