var path	= require('path');

module.exports.getDeviceClasses = function(){
	return require( path.join( __dirname, 'deviceclasses.json' ) );
}