var devkit_lib = require('..');

if( typeof process.argv[2] == 'undefined' ) {
	return console.error("Error: please specify the path to your app folder");
}

var app = new devkit_lib.App( process.argv[2] );
var result = app.validate();

if( result.success ) {
	console.log('Valid app!');
} else {
	console.log('Invalid app!');
	result.errors.forEach(function(error){
		console.log('Error: ' + error);
	})
}