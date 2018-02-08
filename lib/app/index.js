'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const Ajv = require('ajv');
const semver = require('semver');
const Device = require('../Device');

const readFileAsync = util.promisify( fs.readFile );

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
			
			appJson.drivers.forEach(driver => {
				
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
			})
		}
		
		
		
		this.debug(`Validated successfully`);
		
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