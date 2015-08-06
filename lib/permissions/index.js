var path	= require('path');

module.exports.getPermissions = function(){
	var permissions = require( path.join( __dirname, 'permissions.json' ) );
	
	for( var permission in permissions ) {		
		permissions[ permission ] = {
			title	: permissions[ permission ],
			icon	: path.join( __dirname, permission.replace(/\:/g, '-') + '.svg' )
		}		
	}
	
	return permissions;
}