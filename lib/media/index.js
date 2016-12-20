"use strict";

// when providing codec information from a media app or speaker to the media component use the following references
module.exports.getCodecs = function () {
	// list of supported internal codecs by homey
	return [
		'homey:codec:mp3',
		'homey:codec:ogg',
		'homey:codec:flac'
	];
};
