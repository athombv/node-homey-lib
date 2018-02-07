'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const Ajv = require('ajv');

const readFileAsync = util.promisify( fs.readFile );

const VALIDATION_LEVELS = [
	'debug',
	'appstore',
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
		level = 'appstore',
		debug = false,
	} = {}) {
		this._debug = debug;
		
		this.debug(`Validating "${this._path}"`);
		
		if( !VALIDATION_LEVELS.includes(level) )
			throw new Error('Invalid validation level');
			
		let appJson = await readFileAsync( path.join( this._path, 'app.json' ) );
			appJson = JSON.parse(appJson);
		
		const schema = App.getJSONSchema();
		// todo level
		
		const avj = new Ajv({ async: true });
		const validate = avj.compile( schema );
		const valid = await validate( appJson );
		if( valid === false ) throw new Error( JSON.stringify(validate.errors, false, 4) || 'Invalid App JSON' );
		
		/*
			version
			compatibility
			permissions
			category
			driver.class
			driver.capabilities
		*/
			
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