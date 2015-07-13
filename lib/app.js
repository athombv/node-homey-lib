var fs		= require('fs');
var path	= require('path');

function App( app_path ){
	this.app_path = app_path;
}

App.prototype.validate = function(){
	
	var result = {
		success: true,
		errors: []
	}
	
	function error( message ) {
		result.success = false;
		result.errors.push( message );
	}
	
	// check if required files exist
	if( !fs.existsSync( path.join(this.app_path) ) ) 
		error("app folder does not exist");
		
	if( !fs.existsSync( path.join(this.app_path, 'app.js') ) ) 
		error("app.js does not exist");
		
	if( !fs.existsSync( path.join(this.app_path, 'app.json') ) )
		error("app.json does not exist");
		
	if( !fs.existsSync( path.join(this.app_path, 'assets') ) )
		error("./assets/ does not exist");
		
	if( !fs.existsSync( path.join(this.app_path, 'assets', 'icon.svg') ) )
		error("./assets/icon.svg does not exist");
		
	if( !fs.existsSync( path.join(this.app_path, 'readme.md') ) )
		error("readme.md does not exist");
	
	// don't continue if one of the errors fired
	if( result.errors.length > 0 ) return result;
		
	// try to parse the json
	try {
		var json = JSON.parse( fs.readFileSync(path.join( this.app_path, 'app.json' )) );
	} catch(e){
		error("Invalid JSON in app.json [" + e.toString() + "]");
		
		// don't continue if json didn't validate
		return result;
	}
	
	// check if required json entries exist 
	if( typeof json.id == 'undefined' )
		error("missing `id` in app.json");
	
	if( typeof json.version == 'undefined' )
		error("missing `version` in app.json");
	
	if( typeof json.name == 'undefined' )
		error("missing `name` in app.json");
	
	if( typeof json.name == 'object' ) {
		if( typeof json.name.en == 'undefined' )
			error("missing `name.en` in app.json");
	}
	
	if( typeof json.description == 'undefined' )
		error("missing `description` in app.json");
	
	if( typeof json.description == 'object' ) {
		if( typeof json.description.en == 'undefined' )
			error("missing `description.en` in app.json");
	}
	
	/* author is optional
	if( typeof json.author == 'undefined' )
		error("missing `author` in app.json");
	
	if( typeof json.author == 'object' ) {
		if( typeof json.author.name == 'undefined' )
			error("missing `author.name` in app.json");
	}
	*/
	
	// check images
	if( typeof json.images == 'object' ) {
		for( var image in json.images ) {
			if( !fs.existsSync( path.join( this.app_path, json.images[image] ) ) )
				error("images." + image + " file (" + json.images[image] + ") does not exist");
		}
	}
	
	// validate drivers
	if( Array.isArray(json.drivers) ) {
		json.drivers.forEach(function(driver, i){
			
			if( typeof driver.id == 'undefined' )
				return error("missing `driver[" + i + "].id` in app.json");
			
			if( !fs.existsSync( path.join( this.app_path, 'drivers', driver.id ) ) )
				return error("missing folder for driver " + driver.id);					
			
			if( typeof driver.name == 'undefined' )
				error("missing `driver[" + i + "].name` in app.json");
	
			if( typeof driver.name == 'object' ) {
				if( typeof driver.name.en == 'undefined' )
					error("missing `driver[" + i + "].name.en` in app.json");
			
			if( typeof driver.class == 'undefined' )
				error("missing `driver[" + i + "].class` in app.json");
			
			if( !Array.isArray(driver.capabilities) )
				error("missing `driver[" + i + "].capabilities` in app.json");
			}
			
			if( Array.isArray(driver.pair) ) {
				driver.pair.forEach(function(view, j) {			
					if( typeof view.id == 'undefined' )
						return error("missing `driver[" + i + "].pair[" + j + "].id` in app.json");
						
					// if no template set, require a html file
					if( typeof view.template == 'undefined' ) {
						if( !fs.existsSync( path.join( this.app_path, 'drivers', driver.id, 'pair', view.id + '.html') ))
							return error("missing " + view.id + ".html in pair driver " + driver.id + " folder")
					}
				}.bind(this))
			}
	
			// check images
			if( typeof driver.images == 'object' ) {
				for( var image in driver.images ) {
					if( !fs.existsSync( path.join( this.app_path, driver.images[image] ) ) )
						error("drivers[" + i +  "].images." + image + " file (" + driver.images[image] + ") does not exist");
				}
			}
				
		}.bind(this))
	}
	
	// validate flow
	if( typeof json.flow == 'object' ) {
		for( var column in json.flow ) {
			
			json.flow[ column ].forEach(function(card, i){
				
				if( typeof card.method == 'undefined' )
					error("missing flow." + column + "[" + i + "].method in app.json")
					
				if( typeof card.title == 'undefined' )
					error("missing flow." + column + "[" + i + "].title in app.json")
					
				if( typeof card.title == 'object' ) {
					if( typeof card.title.en == 'undefined' )
					error("missing flow." + column + "[" + i + "].title.en in app.json")				
				}
				
				if( Array.isArray(card.args) ) {
					card.args.forEach(function(arg, j){
					
						if( typeof arg.name == 'undefined' )
							error("missing flow." + column + "[" + i + "].arg[" + j + "].name in app.json")
					
						if( typeof arg.type == 'undefined' )
							error("missing flow." + column + "[" + i + "].arg[" + j + "].type in app.json")
								
					}.bind(this))
					
				}
				
			}.bind(this))
			
		}
	}
	
	// validate settings
	// require index.html if folder exists		
	if( fs.existsSync( path.join( this.app_path, 'settings' ) ) && !fs.existsSync( path.join( this.app_path, 'settings', 'index.html' ) ) )
		error("missing ./settings/index.html");
		
	// validate speech
	if( Array.isArray(json.speech) ) {
		json.speech.forEach(function(trigger, i){
				
			if( typeof trigger.id == 'undefined' )
				error("missing speech[" + i + "].id in app.json")
				
			if( typeof trigger.importance != 'number' )
				error("invalid speech[" + i + "].importance in app.json, must be of type number")
				
			if( typeof trigger.importance == 'number' ) {
				if( trigger.importance < 0 || trigger.importance > 1 ) 
					error("speech[" + i + "].importance is out of range [0-1]")
				
			if( typeof trigger.synonyms == 'undefined' )
				error("missing speech[" + i + "].synonyms in app.json")
			
			if( typeof trigger.synonyms == 'object' )
				if( !Array.isArray(trigger.synonyms.en) ) 
					error("missing speech[" + i + "].synonyms.en in app.json")
			}
			
		}.bind(this));
	}
	
	// validate permissions
	if( Array.isArray(json.permissions) ) {
		json.permissions.forEach(function(permission, i){
			
			permission = permission.split(':');
			if( permission[0] != 'homey' || permission.length != 3 ) 
				error("invalid permission[" + i + "] in app.json")
			
		}.bind(this))
	}
	
		
	return result;
}

module.exports = App;