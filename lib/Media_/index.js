'use strict';

const path = require('path');

class Media {
	
	static getCodecs() {
		return require( path.join(__dirname, '..', '..', 'assets', 'media', 'codecs.json' ) );			
	}
	
}

module.exports = Media;