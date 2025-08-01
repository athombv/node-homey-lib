'use strict';

class Util {

  static FEATURE_SPEAKER = 'speaker';
  static FEATURE_LED_RING = 'ledring';
  static FEATURE_NFC = 'nfc';
  static FEATURE_MATTER = 'matter';
  static FEATURE_CAMERA_STREAMING = 'camera-streaming';

  static _platformLocalFeatures = {
    homey1s: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
    homey1d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
    homey1q: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
    homey2s: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
    homey2d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
    homey2q: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING, Util.FEATURE_NFC],
    homey3s: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING],
    homey3d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING],
    homey4d: [Util.FEATURE_SPEAKER, Util.FEATURE_LED_RING],
    homey5q: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
    homey6q: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
  };

  static getPlatformLocalFeatures(modelId) {
    return Util._platformLocalFeatures[modelId] || [];
  }

  static getMissingPlatformLocalFeatures(modelId, wantedFeatures) {
    const features = Util.getPlatformLocalFeatures(modelId);
    return wantedFeatures.filter(feature => !features.includes(feature));
  }

}

module.exports = Util;
