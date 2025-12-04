'use strict';

class Util {

  static getPlatformLocalFeatures(modelId) {
    return Util._platformLocalFeatures[modelId] || [];
  }

  static getMissingPlatformLocalFeatures(modelId, wantedFeatures) {
    const features = Util.getPlatformLocalFeatures(modelId);
    return wantedFeatures.filter(feature => !features.includes(feature));
  }

}

Util.FEATURE_SPEAKER = 'speaker';
Util.FEATURE_LED_RING = 'ledring';
Util.FEATURE_NFC = 'nfc';
Util.FEATURE_MATTER = 'matter';
Util.FEATURE_CAMERA_STREAMING = 'camera-streaming';
Util._platformLocalFeatures = {
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
  homey7q: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
  shs: [Util.FEATURE_MATTER, Util.FEATURE_CAMERA_STREAMING],
};

module.exports = Util;
