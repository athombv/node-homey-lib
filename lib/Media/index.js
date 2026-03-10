'use strict';

class Media {

  /**
   * @returns {Record<string, Record<string, unknown>>}
   */
  static getCodecs() {
    // eslint-disable-next-line global-require
    return require('../../assets/media/codecs.json');
  }

}

module.exports = Media;
