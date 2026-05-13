'use strict';

const assert = require('assert');
const fs = require('fs');

const HomeyLib = require('..');

describe('Zone icons', function() {
  it('returns active zone icons', function() {
    const icons = HomeyLib.getZoneIcons();

    assert.strictEqual(icons.length, 47);
    assert.strictEqual(icons[0].id, 'firstFloor');
    assert.strictEqual(icons[0].fileName, 'first-floor.svg');
    assert.strictEqual(icons.some(icon => icon.id === 'hallwayDoor'), false);

    for (const icon of icons) {
      assert.strictEqual(typeof icon.id, 'string');
      assert.strictEqual(typeof icon.fileName, 'string');
      assert.strictEqual(typeof icon.path, 'string');
      assert.strictEqual(fs.existsSync(icon.path), true);
    }
  });

  it('resolves active, legacy, and unknown zone icons', function() {
    assert.strictEqual(HomeyLib.resolveZoneIcon('default').fileName, 'zone.svg');
    assert.strictEqual(HomeyLib.resolveZoneIcon('bed').id, 'bedroomDouble');
    assert.strictEqual(HomeyLib.resolveZoneIcon('hallwayDoor').fileName, 'hallway-door.svg');
    assert.strictEqual(HomeyLib.resolveZoneIcon('unknown').id, 'default');
  });
});
