var path	= require('path');

module.exports.getPermissions = function(){
	var permissions = require( path.join( __dirname, 'permissions.json' ) );
	
	for( var permission in permissions ) {		
		var title = permissions[ permission ];
		permissions[ permission ] = {
			title	: title,
			icon	: path.join( __dirname, 'icons', permission.replace(/\:/g, '-') + '.svg' )
		}		
	}
	
	return permissions;
}