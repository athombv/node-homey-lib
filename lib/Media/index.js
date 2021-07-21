'use strict';

class Media {

  static getCodecs() {
    // eslint-disable-next-line global-require
    return require('../../assets/media/codecs.json');
  }

}

module.exports = Media;
