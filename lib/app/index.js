'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const Ajv = require('ajv');
const semver = require('semver');
const imageSize = require('image-size');
const SignalValidator = require('homey-signal-validator');
const Device = require('../Device');
const Capability = require('../Capability');

const statAsync = util.promisify( fs.stat );
const readFileAsync = util.promisify( fs.readFile );
const readDirAsync = util.promisify( fs.readdir );
const imageSizeAsync = util.promisify( imageSize );

const VALIDATION_LEVELS = [
	'debug',
	'publish',
];
const IMAGE_MARKERS = {
	'.jpg': new Buffer([ 0xFF, 0xD8 ]),
	'.jpeg': new Buffer([ 0xFF, 0xD8 ]),
	'.png': new Buffer([ 0x89, 0x50, 0x4e, 0x47 ]),
}
const IMAGE_SIZES = {
	'app': {
		'small': { width: 250, height: 175 },
		'large': { width: 500, height: 350 },
	},
	'driver': {
		'small': { width: 75, height: 75 },
		'large': { width: 500, height: 500 },		
	}
}

class App {
	
	constructor( path ) {
		this._path = path;
		
		if( typeof this._path !== 'string' )
			throw new Error('Invalid path');
	}
	
	debug(...args) {
		if( !this._debug ) return;
		console.log('[dbg]', ...args);
	}
	
	async validate({
		level = 'debug',
		debug = false,
	} = {}) {
		this._debug = debug;
		
		this.debug(`Validating "${this._path}"`);
		
		if( !VALIDATION_LEVELS.includes(level) )
			throw new Error(`Invalid validation level. Allowed levels are: ${VALIDATION_LEVELS}`);
			
		const levelPublish = ( level === 'publish' );
			
		let appJson = await readFileAsync( path.join( this._path, 'app.json' ) );
			appJson = JSON.parse(appJson);
			
		const appSdk = appJson.sdk || 1;
		
		const schema = App.getJSONSchema();
			
		if( levelPublish ) {
			schema.required = schema.required.concat( schema.requiredPublish );
			schema.properties.drivers.items.required = schema.properties.drivers.items.required.concat( schema.properties.drivers.items.requiredPublish );
		}
				
		const avj = new Ajv({ async: true });
		const validate = avj.compile( schema );
		const valid = await validate( appJson );
		if( valid === false ) throw new Error( JSON.stringify(validate.errors, false, 4) || 'Invalid App JSON' );
		
		// validate `appJson.id`
		if( !App.isValidId(appJson.id) )
			throw new Error('Invalid id');
		
		// validate `appJson.version`
		if( !semver.valid(appJson.version) )
			throw new Error('Invalid version');
		
		if( semver.coerce(appJson.version).toString() !== appJson.version )
			throw new Error(`Invalid version (${appJson.version}), pre-release versions are not allowed`);
		
		// validate `appJson.compatibility`
		try {
			new (semver.Range)(appJson.compatibility);
		} catch( err ) {
			throw new Error('Invalid compatibility');
		}
		
		// validate `appJson.permissions`
		if( Array.isArray(appJson.permissions) ) {
			
			let allowedPermissions = App.getPermissions();
			
			appJson.permissions.forEach(permission => {
				if( permission.indexOf('homey:app:') === 0 ) return;
				if( typeof allowedPermissions[permission] === 'undefined' )
					throw new Error(`Invalid permission: ${permission}`)
			})
		}
		
		// validate `appJson.category`
		if( typeof appJson.category !== 'undefined' ) {
			
			let allowedCategories = App.getCategories();
			let categories = [];
			
			if( Array.isArray(appJson.category) ) {
				categories = appJson.category;
			} else {
				categories = [ appJson.category ];
			}
			
			categories.forEach(category => {
				if( !allowedCategories.includes(category) )
					throw new Error(`Invalid category: ${category}`);
			})
			
		}
						
		// validate `appJson.drivers`
		if( Array.isArray(appJson.drivers) ) {
			
			let allowedClasses = Device.getClasses();
			let allowedCapabilities = Device.getCapabilities();
			
			for( let i = 0; i < appJson.drivers.length; i++ ) {
				const driver = appJson.drivers[i];
				
				// validate if `/drivers/:id` exists
				await this._ensureFileExistsCaseSensitive( path.join('drivers', driver.id) );
				
				// validate `appJson.drivers[].class`
				if( typeof allowedClasses[driver.class] === 'undefined' )
					throw new Error(`Invalid driver class: ${driver.class}`)
					
				// validate `appJson.drivers[].capabilities`
				driver.capabilities.forEach(capability => {
					
					let capabilityId = capability.split('.')[0];
					let isSystemCapability = ( typeof allowedCapabilities[capabilityId] !== 'undefined' );
					let isAppCapability = ( typeof appJson.capabilities !== 'undefined' && typeof appJson.capabilities[capabilityId] !== 'undefined' )
					
					if( !isSystemCapability && !isAppCapability )
						throw new Error(`Invalid capability: ${capability}`)
				})
				
				// validate `appJson.drivers[].pair`
				if( Array.isArray(driver.pair) ) {
					for( let j = 0; j < driver.pair.length; j++ ) {
						const pairView = driver.pair[j];
						
						// validate if navigation links to an existing view
						if( typeof pairView.navigation !== 'undefined' ) {
							let prevId = pairView.navigation.prev;
							if( prevId ) {							
								let found = driver.pair.find(pairView => {
									return pairView.id === prevId;
								})
								
								if( !found )
									throw new Error(`Invalid navigation.prev: ${prevId}`);
							}
							
							let nextId = pairView.navigation.next;
							if( nextId ) {							
								let found = driver.pair.find(pairView => {
									return pairView.id === nextId;
								})
								
								if( !found )
									throw new Error(`Invalid navigation.next: ${nextId}`);
							}
						}
						
						// validate if `/drivers/:id/pair/(/appJson.drivers[].pair[].id).html` exists
						if( typeof pairView.template === 'undefined' ) {
							await this._ensureFileExistsCaseSensitive( path.join('drivers', driver.id, 'pair', `${pairView.id}.html`) );
						}
					}
				}
				
				// validate `appJson.drivers[].images`
				if( levelPublish ) {
					await this._validateImages(driver.images, 'driver');
				}
			}
		}
		
		// validate `appJson.capabilities`
		if( typeof appJson.capabilities !== 'undefined' ) {
			for( let capabilityId in appJson.capabilities ) {
				let capability = new Capability( appJson.capabilities[capabilityId] );
				try {
					await capability.validate();
				} catch( err ) {
					throw new Error(`Invalid capability: ${capabilityId}\n${err.message}`)
				}
			}
		}
		
		// validate `appJson.signals`
		if( typeof appJson.signals !== 'undefined' ) {
			for( let frequency in appJson.signals ) {
				for( let signalId in appJson.signals[frequency] ) {
					let signal = new SignalValidator( appJson.signals[frequency][signalId], { frequency });
					let result = signal.valid();
					if( result !== true )
						throw new Error(`Invalid signal: ${frequency}.${signalId}\n${result}`)
				}
			}
		}
		
		// validate if `/locales` exists		
		// validate if `/locales/:lang.json` exists & is valid
		let allowedLocales = App.getLocales();
		let locales = await this._getDirectoryContents('locales');
		for( let i = 0; i < locales.length; i++ ) {
			let locale = locales[i];
			if( path.extname(locale) !== '.json' ) continue;
			let basename = path.basename(locale, '.json');
			
			if( !allowedLocales.includes(basename) )
				throw new Error(`Invalid locale: /locales/${basename}.json\nAllowed locales are: ${allowedLocales}`);
			
			try {
				let localeJson = await readFileAsync(locale, 'utf8');
				JSON.parse(localeJson);
			} catch( err ) {
				throw new Error(`Malformed locale: /locales/${basename}.json\n${err.message}`);
			}
		}
		
		// validate if `/app.js` exists
		if( appSdk === 1 ) {
			await this._ensureFileExistsCaseSensitive('app.js');
		}
		
		// validate `/env.json`
		if( await this._fileExistsCaseSensitive('env.json') ) {
			let envJson;
			try {
				envJson = await readFileAsync( path.join(this._path, 'env.json'), 'utf8');
				envJson = JSON.parse(envJson);
			} catch( err ) {
				throw new Error(`Malformed file: /env.json\n${err.message}`);
			}
			
			if( envJson ) {	
				for( let key in envJson ) {
					if( key.toUpperCase() !== key )
						throw new Error(`Invalid /env.json key, must be uppercase: ${key}`);
						
					let value = envJson[key];
					if( typeof value !== 'string' )
						throw new Error(`Invalid /env.json value, must be of type string: ${value}`);
						
				}
			}
		}
		
		// validate if `/assets/icon.svg` exists
		await this._ensureFileExistsCaseSensitive( path.join('assets', 'icon.svg') );
		
		// validate `/settings/`
		if( await this._fileExistsCaseSensitive('settings') ) {
			await this._ensureFileExistsCaseSensitive( path.join('settings', 'index.html') );
		}
		
		if( levelPublish ) {
			await this._validateImages(appJson.images, 'app');
		}
		
		this.debug(`Validated successfully`);
		
	}
	
	async _getDirectoryContents(filepath) {
		await this._fileExistsCaseSensitive(filepath);
		
		filepath = path.join( this._path, filepath );
				
	    return readDirAsync(filepath).then( files => {
		    return files.map(file => {
			    return path.join( filepath, file );
			});
	    });		
	}
	
	async _ensureFileExistsCaseSensitive(filepath) {
		let exists = await this._fileExistsCaseSensitive( filepath );
		if( exists !== true )
			throw new Error(`Filepath does not exist: ${filepath}`);
	}
	
	async _fileExistsCaseSensitive(filepath) {
		filepath = path.join( this._path, filepath );
		let dir = path.dirname( filepath );

		try {
				let stat = await statAsync( dir );
				if( !stat.isDirectory() ) return false;

				let contents = await readDirAsync( dir );
				return contents.indexOf( path.basename(filepath) ) > -1;
		} catch( err ) {
			return false;
		}
	}
	
	async _validateImages(imagesObj, type) {
				
		const sizes = [ 'small', 'large' ];
		for( let i = 0; i < sizes.length; i++ ) {
			let size = sizes[i];
			let imagePath = imagesObj[size];
			let extension = path.extname(imagePath);
			
			if( typeof IMAGE_MARKERS[extension] === 'undefined' )
				throw new Error(`Invalid image extention: ${extension}`);
			
			await this._ensureFileExistsCaseSensitive( imagePath );
			
			let compareBuffer = IMAGE_MARKERS[extension];
			let imageBytes = await this._readBytes( imagePath, compareBuffer.length );
			
			if( !imageBytes.equals(compareBuffer) )
				throw new Error(`Invalid image: ${imagePath}`);
				
			let requiredSize = IMAGE_SIZES[type][size];
			let imageSize = await imageSizeAsync( path.join( this._path, imagePath ) );
			if( imageSize.width !== requiredSize.width
			 || imageSize.height !== requiredSize.height )
			 	throw new Error(`Invalid image size (${imageSize.width}x${imageSize.height}): ${imagePath}\nRequired: ${requiredSize.width}x${requiredSize.height}`);
		}
	}
	
	async _readBytes( filepath, numBytes ) {
		filepath = path.join( this._path, filepath );
		
		return new Promise((resolve, reject) => {
			fs.open(filepath, 'r', (err, fd) => {
				if( err ) return reject( err );
				
			    let buffer = new Buffer(numBytes);
			    fs.read(fd, buffer, 0, numBytes, 0, err => {
				    if( err ) return reject( err );
				    return resolve( buffer );
			    });
			});
		})
		
	}
	
	static isValidId( appId ) {
		if( typeof appId !== 'string' ) return false;
		if( appId.length < 1 ) return false;
		if( appId.split('.').length < 2 ) return false;
		if( !(/^[a-zA-Z0-9_.-]*$/g).test(appId) ) return false;
		return true;
	}
	
	static getJSONSchema() {
		return require( path.join(__dirname, '..', '..', 'assets', 'app', 'schema.json' ) );	
	}
	
	static getPermissions() {
		const permissions = require( path.join(__dirname, '..', '..', 'assets', 'app', 'permissions.json' ) );		
		
		for( let id in permissions ) {
			let permission = permissions[id];
			permission.icon = path.join(__dirname, '..', '..', 'assets', 'app', 'permissions', `${id.replace(/\:/g, '-')}.svg` )
		}
		
		return permissions;
	}
	
	static getCategories() {
		return [ 'lights', 'video', 'music', 'appliances', 'security', 'climate', 'tools', 'internet', 'localization', 'energy' ];
	}
	
	static getLocales() {
		return [ 'en', 'nl', 'de', 'es', 'fr' ];
	}
	
}

module.exports = App;