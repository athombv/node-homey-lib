"use strict";

const fs				= require('fs');
const path				= require('path');

const semver			= require('semver');
const sizeOf			= require('image-size');
const SignalValidator	= require('homey-signal-validator');
const deviceclasses		= require('../deviceclasses/index.js');

const allowedLocales 	= [ 'en', 'nl', 'de', 'es', 'fr' ];
const allowedCategories = [ 'lights', 'video', 'music', 'appliances', 'security', 'climate', 'tools', 'internet', 'localization', 'energy' ];

const jpgBuf = new Buffer([ 0xFF, 0xD8 ]);
const pngBuf = new Buffer([ 0x89, 0x50, 0x4e, 0x47 ]);

// allowed types for driver settings
const allowedDriverSettingsTypes = {
	'label'		: 'string',
	'text'		: 'string',
	'password'	: 'string',
	'textarea'	: 'string',
	'number'	: 'number',
	'radio'		: 'string',
	'checkbox'	: 'boolean',
	'dropdown'	: 'string'
}

function App( app_path ){
	this.app_path = app_path;
}

/*
 Validate an app

 Parameters:
 Boolean lvl_publish (optional): check for app store (more strict checks)

 */

App.prototype.getAllowedLocales = function(){
	return allowedLocales;
}

App.prototype.getAllowedCategories = function(){
	return allowedCategories;
}

App.prototype.validate = function( lvl_publish ){

	var result = {
		success: true,
		errors: []
	}

	function error( message, is_warning ) {
		result.success = false;
		result.errors.push( message );
		return result;
	}

	// check if required files exist
	if( !fileExistsSyncCaseSensitive( this.app_path ) )
		error("app folder does not exist");

	if( !fileExistsSyncCaseSensitive( path.join(this.app_path, 'app.json') ) )
		error("app.json does not exist");

	if( !fileExistsSyncCaseSensitive( path.join(this.app_path, 'assets') ) )
		error("./assets/ does not exist");

	if( !fileExistsSyncCaseSensitive( path.join(this.app_path, 'assets', 'icon.svg') ) )
		error("./assets/icon.svg does not exist");

	if( lvl_publish && !fileExistsSyncCaseSensitive( path.join(this.app_path, 'README.md') ) )
		error("README.md does not exist");

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

	let sdk = parseInt(json.sdk);
	if( isNaN(sdk) ) sdk = 1;

	if( sdk < 2 ) {
		if( !fileExistsSyncCaseSensitive( path.join(this.app_path, 'app.js') ) )
			error("app.js does not exist");
	}

	// check if required json entries exist
	if( typeof json.id == 'undefined' )
		error("missing `id` in app.json");

	if( typeof json.id != 'undefined' ) {

		if( json.id.length < 5 )
			error("invalid `id` in app.json: a length of at least 5 characters is required");

		if( json.id.indexOf('.') < 1 || json.id.indexOf('.') == (json.id.length-1) )
			error("invalid `id` in app.json: at least a dot is required between characters");

		var allowed_id_chars = 'abcdefghijklmnopqrstuvwxyz0123456789.-'.split('');

		json.id.split('').forEach(function( character ){
			if( allowed_id_chars.indexOf(character) < 0 )
				error("invalid `id` in app.json. Allowed characters: " + allowed_id_chars.join(''));
		});
	}

	if( typeof json.version == 'undefined' )
		error("missing `version` in app.json");

	if( typeof json.version != 'undefined' ){
		if( semver.valid(json.version) ) {
			if( json.version.indexOf('-') > -1 )
				error('pre-release versions are not allowed');

			if( json.version.indexOf('+') > -1 )
				error('build-metadata versions are not allowed');
		} else {
			error("invalid `version` in app.json");
		}
	}

	if( typeof json.compatibility == 'undefined' )
		error("missing `compatibility` in app.json");

	if( typeof json.compatibility != 'undefined' ){
		if( !semver.validRange(json.compatibility) )
			error("invalid `compatibility` in app.json");
	}

	if( typeof json.name == 'undefined' )
		error("missing `name` in app.json");

	if( typeof json.name == 'object' ) {
		if( typeof json.name.en == 'undefined' )
			error("missing `name.en` in app.json");
	}

	if( lvl_publish && typeof json.description == 'undefined' )
		error("missing `description` in app.json");

	if( lvl_publish && typeof json.description == 'object' ) {
		if( typeof json.description.en == 'undefined' )
			error("missing `description.en` in app.json");
	}

	if( lvl_publish && typeof json.category == 'string' ) {
		if( allowedCategories.indexOf(json.category) < 0 )
			error("invalid category `" + json.category + "` in app.json. Allowed categories: [" + allowedCategories.join(', ') + "]");
	} else if( lvl_publish && Array.isArray(json.category) ) {
		json.category.forEach(function(category, i){
			if( allowedCategories.indexOf(category) < 0 )
				error("invalid category `" + category + "` in app.json. Allowed categories: [" + allowedCategories.join(', ') + "]");
		});
	} else if( lvl_publish ) {
		error("missing `category` in app.json");
	}

	if( lvl_publish && typeof json.contributors != 'undefined' ) {

		[ 'developers', 'translators' ].forEach(function(contributor_type){

			if( Array.isArray(json.contributors[contributor_type]) ) {
				json.contributors[contributor_type].forEach(function(contributor, i){
					if( typeof contributor == 'object' ) {
						if( typeof contributor.name != 'string' )
							error("`contributors." + contributor_type + "[" + i + "].name` is undefined or not a string");

						if( typeof contributor.email != 'string' )
							error("`contributors." + contributor_type + "[" + i + "].email` is undefined or not a string");

						if( contributor_type == 'translators' ) {
							if( Array.isArray(contributor.languages) ) {
								contributor.languages.forEach(function(language, j){
									if( typeof language != 'string' )
										error("`contributors." + contributor_type + "[" + i + "].languages[" + j + "]` is not a string");
								})
							} else {
								error("`contributors." + contributor_type + "[" + i + "].languages` is not an array");
							}
						}

					} else {
						error("`contributors." + contributor_type + "[" + i + "]` is not an object");
					}

				});
			} else if( typeof json.contributors[contributor_type] != 'undefined' ) {
				error("`contributors.developers` is not an array");
			}

		})
	}

	// check tags
	if( lvl_publish && typeof json.tags !== 'undefined' ) {

		if( typeof json.tags === 'object' ) {

			for( let language in json.tags ) {

				if( Array.isArray(json.tags[language]) ) {
					json.tags[language].forEach(function(tag, i){
						if( typeof tag !== 'string' ) {
							error('tags[' + language + '][' + i + '] is not a string');
						}
					})

				} else {
					error('tags[' + language + '] is not an array');
				}

			}

		} else {
			error('tags is not an object');
		}

	}

	// check images
	if( lvl_publish && typeof json.images == 'object' ) {

		if( !json.images.large )
			error("missing `json.images.large` in app.json");

		if( !json.images.small )
			error("missing `json.images.small` in app.json");

		for( var image in json.images ) {

			var image_value = json.images[image];
			var image_path = path.join( this.app_path, image_value );
			var image_ext = path.extname( image_path );
			if( image_ext != '.jpg' && image_ext != '.png' ) {
				error("drivers[" + i +  "].images." + image + " file (" + image_value + ") is not a .jpg or .png file");
				continue;
			}

			if( !fileExistsSyncCaseSensitive( image_path ) ) {
				error("`images." + image + "` file (" + image_value + ") does not exist");
				continue;
			}

			var imageBuf = fs.readFileSync( image_path );
			if(
				( image_ext === '.jpg' && !imageBuf.slice( 0, jpgBuf.length ).equals(jpgBuf) )
			 || ( image_ext === '.png' && !imageBuf.slice( 0, pngBuf.length ).equals(pngBuf) )
			) {
				error("`images." + image + "` has invalid contents, expected " + image_ext.substring(1));
				continue;
			}

			try {
				var image_size = sizeOf( image_path );

				// check size
				if( image == 'large' && ( image_size.width != 500 || image_size.height != 350 ) )
					error("`images." + image + "` has invalid dimensions (" + image_size.width + "x" + image_size.height + "), must be 500x350");

				if( image == 'small' && ( image_size.width != 250 || image_size.height != 175 ) )
					error("`images." + image + "` has invalid dimensions (" + image_size.width + "x" + image_size.height + "), must be 250x175");

			} catch( err ) {
				console.error('Warning:', err, image_path);
			}

		}
	} else if( lvl_publish ) {
		error("missing `images` in app.json")
	}

	// validate drivers
	if( Array.isArray(json.drivers) ) {
		json.drivers.forEach(function(driver, i){

			if( typeof driver.id == 'undefined' )
				return error("missing `driver[" + i + "].id` in app.json");

			if( !fileExistsSyncCaseSensitive( path.join( this.app_path, 'drivers', driver.id ) ) )
				return error("missing folder for driver `" + driver.id + "`");

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

			// check pair
			if( Array.isArray(driver.pair) ) {
				driver.pair.forEach(function(view, j) {
					if( typeof view.id == 'undefined' )
						return error("missing `driver[" + i + "].pair[" + j + "].id` in app.json");

					// if no template set, require a html file
					if( typeof view.template == 'undefined' ) {
						if( !fileExistsSyncCaseSensitive( path.join( this.app_path, 'drivers', driver.id, 'pair') ))
							return error("missing `/drivers/" + driver.id + "/pair/` folder")

						if( !fileExistsSyncCaseSensitive( path.join( this.app_path, 'drivers', driver.id, 'pair', view.id + '.html') ))
							return error("missing `/drivers/" + driver.id + "/pair/" + view.id + ".html`")
					}
				}.bind(this))
			}

			// check settings
			if( Array.isArray(driver.settings) ) {

				function checkSettingsRecursive( settingsObj, path ) {

					settingsObj.forEach(function(setting, j) {

						if( setting.type === 'group' ) {

							if( typeof setting.children == 'undefined' )
								return error("missing `driver[" + i + "].settings" + path + "[" + j + "].children` in app.json");

							if( !Array.isArray(setting.children) )
								return error("`driver[" + i + "].settings" + path + "[" + j + "].children` in app.json is not an Array.");

							if( typeof setting.children == 'undefined' )
								return error("missing `driver[" + i + "].settings" + path + "[" + j + "].children` in app.json");

							if( !Array.isArray(setting.children) )
								return error("`driver[" + i + "].settings" + path + "[" + j + "].children` in app.json is not an Array.");

							checkSettingsRecursive.call( this, setting.children, path + `[${j}].children` );

						} else {

							if( typeof setting.id == 'undefined' )
								return error("missing `driver[" + i + "].settings" + path + "[" + j + "].id` in app.json");

							if( typeof setting.type == 'undefined' )
								return error("missing `driver[" + i + "].settings" + path + "[" + j + "].type` in app.json");

							if( typeof setting.value == 'undefined' )
								return error("missing `driver[" + i + "].settings" + path + "[" + j + "].value` in app.json");

							if( typeof setting.value !== allowedDriverSettingsTypes[ setting.type ] )
								return error("invalid type for `driver[" + i + "].settings" + path + "[" + j + "].value` in app.json, expected type " + allowedDriverSettingsTypes[ setting.type ] );

						}

					}.bind(this))

				}

				checkSettingsRecursive.call( this, driver.settings, '' );
			}

			// check images
			if( lvl_publish && typeof driver.images == 'object' ) {

				if( !driver.images.large )
					error("missing `drivers[" + driver.id +  "].images.large` in app.json");

				if( !driver.images.small )
					error("missing `drivers[" + driver.id +  "].images.small` in app.json");

				for( var image in driver.images ) {

					var image_value = driver.images[image];
					var image_path = path.join( this.app_path, image_value );
					var image_ext = path.extname( image_path );
					if( image_ext != '.jpg' && image_ext != '.png' ) {
						error("drivers[" + driver.id +  "].images." + image + " file (" + image_value + ") is not a .jpg or .png file");
						continue;
					}

					if( !fileExistsSyncCaseSensitive( image_path ) ) {
						error("`drivers[" + driver.id +  "].images." + image +  "` file (" + image_value + ") does not exist");
						continue;
					}

					var imageBuf = fs.readFileSync( image_path );
					if(
						( image_ext === '.jpg' && !imageBuf.slice( 0, jpgBuf.length ).equals(jpgBuf) )
					 || ( image_ext === '.png' && !imageBuf.slice( 0, pngBuf.length ).equals(pngBuf) )
					) {
						error("`drivers[" + driver.id +  "].images." + image + "` has invalid contents, expected " + image_ext.substring(1));
						continue;
					}

					try {
						var image_size = sizeOf( image_path );

						if( image == 'large' && ( image_size.width != 500 || image_size.height != 500 ) )
							error("`drivers[" + driver.id +  "].images." + image + "` has invalid dimensions (" + image_size.width + "x" + image_size.height + "), must be 500x500");

						if( image == 'small' && ( image_size.width != 75 || image_size.height != 75 ) )
							error("`drivers[" + driver.id +  "].images." + image + "` has invalid dimensions (" + image_size.width + "x" + image_size.height + "), must be 75x75");

					} catch( err ) {
						console.error('Warning:', err, image_path);
					}
				}
			} else if( lvl_publish ) {
				error("missing `drivers[" + driver.id +  "].images` in app.json");
			}

			if( lvl_publish && typeof driver.gtin !== 'undefined' ) {
				if( Array.isArray(driver.gtin) ) {
					driver.gtin.forEach(function(gtin, j){
						if( typeof gtin === 'string' ) {
							if( !(gtin.length === 8 || gtin.length === 12 || gtin.length === 13 || gtin.length === 14) )
								error("invalid `drivers[" + driver.id +  "].gtin[" + j + "]` length in app.json");

							if( !isNumeric(gtin) )
								error("invalid `drivers[" + driver.id +  "].gtin[" + j + "]` (non-numeric) in app.json");

						} else {
							error("invalid `drivers[" + driver.id +  "].gtin[" + j + "]` type in app.json");
						}
					});
				} else {
					error("invalid `drivers[" + driver.id +  "].gtin` in app.json");
				}
			}

		}.bind(this))
	}

	// validate flow
	if( typeof json.flow == 'object' ) {
		for( var column in json.flow ) {

			json.flow[ column ].forEach(function(card, i){

				if( typeof card.id == 'undefined' )
					error("missing `flow." + column + "[" + i + "].id` in app.json")

				if( typeof card.title == 'undefined' )
					error("missing `flow." + column + "[" + i + "].title` in app.json")

				if( typeof card.title == 'object' ) {
					if( typeof card.title.en == 'undefined' )
						error("missing `flow." + column + "[" + i + "].title.en` in app.json")
				}

				if( Array.isArray(card.args) ) {
					card.args.forEach(function(arg, j){

						if( typeof arg.name == 'undefined' )
							error("missing `flow." + column + "[" + i + "].arg[" + j + "].name` in app.json")

						if( typeof arg.type == 'undefined' )
							error("missing `flow." + column + "[" + i + "].arg[" + j + "].type` in app.json")

					}.bind(this))

				}

			}.bind(this))

		}
	}

	// validate settings
	// require index.html if folder exists
	if( fileExistsSyncCaseSensitive( path.join( this.app_path, 'settings' ) ) && !fileExistsSyncCaseSensitive( path.join( this.app_path, 'settings', 'index.html' ) ) )
		error("missing ./settings/index.html");

	// validate speech
	if( Array.isArray(json.speech) ) {
		json.speech.forEach(function(trigger, i){

			if( typeof trigger.id == 'undefined' ) {
				error("missing `speech[" + i + "].id` in app.json")
			}

			if( typeof trigger.importance == 'number' ) {
				if( trigger.importance < 0 || trigger.importance > 1 ) {
					error("`speech[" + i + "].importance` is out of range [0-1]")
				}
			} else if( trigger.importance !== false ) {
				error("`speech[" + i + "].importance` not a number, or boolean false");
			}

			if( typeof trigger.triggers == 'undefined' ) {
				error("missing `speech[" + i + "].triggers` in app.json")
			}

			if( typeof trigger.triggers == 'object' ) {
				if( !Array.isArray(trigger.triggers.en) ) {
					error("missing `speech[" + i + "].triggers.en` in app.json")
				}
			}

		}.bind(this));
	}else if( json.speech ) {
		const systemPropertyNames = ['TIME', 'REGEX', 'LOCATION', 'ZONE', 'GROUPDEVICE', 'VP', 'NP'];
		const systemPropertyNameRegex = new RegExp(`\\b(${systemPropertyNames.join("|")})\\b`);

		if( !json.speech.en ) {
			error("English speech property is required");
			return result;
		}
		if( !json.speech.en.group ) {
			error("English speech `group` property is required");
			return result;
		}

		for( var language in json.speech ) {
			let componentNames = [];
			let namesInSets = [];

			//validate elements
			if( !json.speech[ language ].element ) 	{
				error("speech elements missing for language: " + language);
				continue;
			}

			let elements = json.speech[ language ].element;
			for (var name in elements) {
				if (name.match(systemPropertyNameRegex)) {
					error("System elements cannot be modified: " + name);
					continue;
				}
				if (typeof elements[name].type != 'string' || !elements[name].type.match(/(string|regex|lemma|pos|device)/)) return error("Invalid type in: " + name);

				if (componentNames.indexOf(name) !== -1) {
					error("speech name used more than once: " + name);
					continue;
				}
				componentNames.push(name);
			}

			//validate groups
			if( !json.speech[ language ].group ) {
				//TODO: Make this a warning
				// error("speech groups missing for language: " + language + ". Using English group structure instead", true);
			}else{
				let groups = json.speech[ language ].group;
				let capturingGroups = [];
				for (var name in groups) {
					if (typeof groups[name].set != 'string') {
						error("Group requires set: "+name);
						continue;
					}
					if (groups[name].set.match(/\|\|/) && (groups[name].set.match(/\&\&/))) {
						error("Invalid set: " + name+". Sets cannot combine || and &&.");
						continue;
					}

					if (componentNames.indexOf(name) !== -1) {
						error("speech name used more than once: " + name);
						continue;
					}
					componentNames.push(name);

					const andGroup = groups[name].set.match(/\&\&/);
					if (andGroup && (typeof groups[name].ordered === 'undefined' || typeof groups[name].allowDisconnect === 'undefined')) error("Required property missing in &&-group: "+ name);
					if (andGroup &&  typeof groups[name].ordered != 'boolean') 			error("TypeError: \'ordered\' of "+name+" is not boolean");
					if (andGroup &&  typeof groups[name].allowDisconnect != 'boolean') 	error("TypeError: \'allowDisconnect\' of "+name+" is not boolean");
					if (andGroup &&  typeof groups[name].capturingGroup != 'boolean') 	error("TypeError: \'capturingGroup\' of "+name+" is not boolean");

					//check if not only optional tokens, or optional tokens in ordered group
					let set = groups[name].set.split(/\s?(?:\&\&|\|\|)\s?/);

					let optional = 0;

					set.forEach( (componentName, index) => {
						const match = componentName.match(/\(((?:[\w])+)\)/i);
						if (match) {
							set[index] = match[1];
							optional++;
						}
					})

					if (optional === set.length) error("Groups can\'t only have optional components. Group: " + name);

					namesInSets = namesInSets.concat(set);

					if (groups[name].capturingGroup) capturingGroups.push(name);
				}
				if (capturingGroups.length == 0) error("No capturing groups: " + language);

				namesInSets.forEach( name => {
					if (componentNames.indexOf(name) == -1 && systemPropertyNames.indexOf(name) == -1) error("speech component does not exist: " + name);
				})

				componentNames.forEach( name => {
					if (
						namesInSets.indexOf(name) == -1 &&
						!name.match(systemPropertyNameRegex) &&
						!(groups[name] && groups[name].capturingGroup)
					) {
						error("speech component created but not used: " + name, true);
					}
				})
			}
		}
	}

	if( lvl_publish && typeof json.speechExamples !== 'undefined' ) {
		if( typeof json.speechExamples === 'object' ) {

			var hasEnglish = false;

			for( var language in json.speechExamples ) {
				var speechExamplesArray = json.speechExamples[ language ];
				if( Array.isArray(speechExamplesArray) ) {

					speechExamplesArray.forEach(function(speechExample, i){
						if( typeof speechExample !== 'string' ) {
							error("invalid type `speechExamples." + language + "[" + i + "]` in app.json, expected string");
						}
					})

					if( language === 'en' )
						hasEnglish = true;

				} else {
					error("invalid type `speechExamples." + language + "` in app.json, expected array");
				}
			}

			if( !hasEnglish )
				error('missing speechExamples.en in app.json');

		} else {
			error("invalid type `speechExamples` in app.json, expected object")
		}
	}

	// validate permissions
	if( Array.isArray(json.permissions) ) {
		json.permissions.forEach(function(permission, i){

			var permission_parts = permission.split(':');
			if( permission_parts[0] != 'homey' || permission_parts.length != 3 )
				return error("invalid permission[" + i + "] in app.json")

			if( permission_parts[1] != 'app' ) {
				var devkit_lib = require('../..');
				var allowed_permissions = devkit_lib.permissions.getPermissions();

				var valid = false;
				for( var allowed_permission in allowed_permissions ) {
					if( permission == allowed_permission ) valid = true;
				}

				if( !valid ) return error("invalid permission `" + permission + "`")
			}

		}.bind(this))
	}

	// validate locales
	var localesPath = path.join( this.app_path, 'locales' );
	try {
		var locales = fs.readdirSync( localesPath );
		locales = locales.filter(function(locale){
			return locale.substr( locale.length-5 ) == '.json';
		})
		locales = locales.forEach(function(locale){

			// validate language
			var basename = path.basename( locale, '.json' );
			if( allowedLocales.indexOf(basename) == -1 ) {
				return error("invalid locale: " + locale)
			}

			// validate json
			try {
				require( path.join(localesPath, locale) );
			} catch(e){
				return error('invalid JSON for locale ' + locale + ' [' + e.toString() + ']')
			}
		})
	} catch(e){}

	// validate env.json
	var env_path = path.join( this.app_path, 'env.json');
	if( fs.existsSync( env_path ) ) {
		try {
			var env = fs.readFileSync( env_path );
			env = JSON.parse(env);

			for( var key in env ) {
				var value = env[key];

				if( key.toUpperCase() != key ) error('env.json key `' + key + '` must be uppercase');
				if( typeof value != 'string' ) error('env.json `' + key + '` must be of type string');
			}

		} catch(e){
			error('invalid JSON for env.json [' + e.toString() + ']')
		}
	}

	// validate capabilities
	if( typeof json.capabilities !== 'undefined' ) {
		if( typeof json.capabilities !== 'object' )
			return error('invalid capabilities in app.json');

		var capabilities = deviceclasses.getDeviceClasses().capabilities;

		for( let capabilityId in json.capabilities ) {

			// prevent system capability name collision
			if( typeof capabilities[ capabilityId] !== 'undefined' ) {
				error(`capabilities.${capabilityId}: invalid capability id, already a system capability`);
				continue;
			}

			var validateCapability = require('../deviceclasses/index.js').validateCapability;
			var isValid = validateCapability( json.capabilities[ capabilityId ] );
			if( Array.isArray(isValid) ) {
				isValid.forEach(function(errorMsg){
					error(`capabilities.${capabilityId}: ` + errorMsg)
				})
			}
		}
	}

	// validate signals
	if( typeof json.signals !== 'undefined' ) {
		if( typeof json.signals !== 'object' )
			return error('invalid signals in app.json');

		for( let signalFrequency in json.signals ) {
			for( let signalId in json.signals[ signalFrequency ] ) {
				var validator = new SignalValidator( json.signals[ signalFrequency ][ signalId ], {
					frequency: signalFrequency
				})
				var isValid = validator.valid();
				if( Array.isArray(isValid) ) {
					isValid.forEach(function(errorMsg){
						error(`signals.${signalFrequency}.${signalId}: ` + errorMsg)
					})
				}
			}
		}
	}


	return result;
}

function fileExistsSyncCaseSensitive( file_path ) {

	try {
		var dir = path.dirname( file_path );

		if( !fs.existsSync(dir) ) return false;

		var dirContents = fs
			.readdirSync( dir )

		var exists = dirContents.indexOf( path.basename(file_path) ) > -1;
		return exists;
	} catch(e) {
		return false;
	}

}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = App;

