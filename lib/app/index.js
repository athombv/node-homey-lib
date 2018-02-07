'use strict';

const path = require('path');

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
			
		// TODO
			
		this.debug(`Validated successfully`);
		
	}
	
	static getPermissions() {
		const permissions = require( path.join(__dirname, '..', '..', 'assets', 'app', 'permissions.json' ) );		
		
		for( let id in permissions ) {
			let permission = permissions[id];
			permission.icon = path.join(__dirname, '..', '..', 'assets', 'app', 'permissions', `${id.replace(/\:/g, '-')}.svg` )
		}
		
		return permissions;
	}
	
}

module.exports = App;