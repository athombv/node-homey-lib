'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const Ajv = require('ajv');
const semver = require('semver');
const SignalValidator = require('homey-signal-validator');
const Device = require('../Device');
const Capability = require('../Capability');

const readFileAsync = util.promisify( fs.readFile );
const readDirAsync = util.promisify( fs.readdir );

const VALIDATION_LEVELS = [
	'debug',
	'publish',
]

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
			throw new Error('Invalid validation level');
			
		let appJson = await readFileAsync( path.join( this._path, 'app.json' ) );
			appJson = JSON.parse(appJson);
			
		const appSdk = appJson.sdk || 1;
		
		const schema = App.getJSONSchema();
			
		if( level === 'publish' )
			schema.required = schema.required.concat( schema.requiredPublish );
				
		const avj = new Ajv({ async: true });
		const validate = avj.compile( schema );
		const valid = await validate( appJson );
		if( valid === false ) throw new Error( JSON.stringify(validate.errors, false, 4) || 'Invalid App JSON' );
		
		// validate `appJson.version`
		if( !semver.valid(appJson.version) )
			throw new Error('Invalid version');
		
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
				await this._ensureFileExistsCaseSensitive(`/drivers/${driver.id}`);
				
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
							await this._ensureFileExistsCaseSensitive(`/drivers/${driver.id}/pair/${pairView.id}.html`);
						}
					}
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
		let locales = await this._getDirectoryContents('/locales/');
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
			await this._ensureFileExistsCaseSensitive('/app.js');
		}
		
		// validate `/env.json`
		if( await this._fileExistsCaseSensitive('/env.json') ) {
			let envJson;
			try {
				envJson = await readFileAsync( path.join(this._path, '/env.json'), 'utf8');
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
		
		// validate `/settings/`
		if( await this._fileExistsCaseSensitive('/settings') ) {
			await this._ensureFileExistsCaseSensitive('/settings/index.html');
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
		
		const check = async filepath => {	
		    let dir = path.dirname(filepath);
		    if (dir === '/' || dir === '.') return true;
		    let filenames = await readDirAsync(dir);
		    if (filenames.indexOf(path.basename(filepath)) === -1) {
		        return false;
		    }
		    return check(dir);			
		}
		
		return await check( filepath );
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