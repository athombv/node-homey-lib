var path	= require('path');

module.exports.getPermissions = function(){
	var permissions = require( path.join( __dirname, 'permissions.json' ) );
	
	var result = {};
	
	for( var permission in permissions ) {
		result[ permission ] = {
			title	: permissions[ permission ],
			icon	: path.join( __dirname, 'icons', permission.replace(/\:/g, '-') + '.svg' )
		}		
	}
	
	return result;
}