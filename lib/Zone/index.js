'use strict';

const { join } = require('../../helpers');

/** @typedef {{ id: string, fileName: string }} ZoneIconManifestIcon */
/** @typedef {{ id: string, targetId: string, fileName?: string }} ZoneIconManifestLegacyIcon */
/** @typedef {{ defaultIconId: string, icons: ZoneIconManifestIcon[], legacyIcons: ZoneIconManifestLegacyIcon[] }} ZoneIconManifest */
/** @typedef {{ id: string, fileName: string, path?: string }} ZoneIconDescriptor */

/** @type {ZoneIconManifest} */
const ICONS_MANIFEST = require('../../assets/zone/icons.json');

const ICONS_PATH_SEGMENTS = [__dirname, '..', '..', 'assets', 'zone', 'icons'];
const DEFAULT_ICON_ID = ICONS_MANIFEST.defaultIconId;
const ACTIVE_ICONS = ICONS_MANIFEST.icons.reduce((obj, icon) => {
  obj[icon.id] = icon.fileName;
  return obj;
}, {});
const LEGACY_ICONS = ICONS_MANIFEST.legacyIcons.reduce((obj, icon) => {
  obj[icon.id] = {
    id: icon.targetId,
    fileName: icon.fileName,
  };
  return obj;
}, {});

/** @type {ZoneIconDescriptor[] | undefined} */
let iconsCache;

class Zone {

  /**
   * @returns {ZoneIconDescriptor[]}
   */
  static getIcons() {
    if (iconsCache) return iconsCache;

    iconsCache = ICONS_MANIFEST.icons.map(({ id, fileName }) => Zone._createIconDescriptor({
      id,
      fileName,
    }));

    return iconsCache;
  }

  /**
   * @param {string | null | undefined} icon
   * @returns {ZoneIconDescriptor}
   */
  static resolveIcon(icon) {
    const legacyIcon = typeof icon === 'string' ? LEGACY_ICONS[icon] : undefined;
    const id = legacyIcon ? legacyIcon.id : icon;
    let fileName = legacyIcon ? legacyIcon.fileName : undefined;

    if (!fileName && typeof id === 'string') {
      fileName = ACTIVE_ICONS[id];
    }

    if (!fileName) {
      return Zone._createIconDescriptor({
        id: DEFAULT_ICON_ID,
        fileName: ACTIVE_ICONS[DEFAULT_ICON_ID],
      });
    }

    return Zone._createIconDescriptor({
      id,
      fileName,
    });
  }

  static _createIconDescriptor({
    id,
    fileName,
  }) {
    const descriptor = {
      id,
      fileName,
    };

    if (typeof join === 'function') {
      descriptor.path = join(...ICONS_PATH_SEGMENTS, fileName);
    }

    return descriptor;
  }

}

module.exports = Zone;
