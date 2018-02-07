'use strict';

const path = require('path');
const Ajv = require('ajv');

class Capability {
	
	constructor( capability ) {
		this._capability = capability;
	}
	
	debug(...args) {
		if( !this._debug ) return;
		console.log('[dbg]', ...args);
	}
	
	async validate({ debug = false }) {
		this._debug = debug;
		
		this.debug(`Validating capability`);
		
		const avj = new Ajv();
		const validate = avj.compile( Capability.getJSONSchema() );
		const valid = validate( this._capability );
		if( !valid ) throw new Error( avj.errors || 'Invalid Capability' )
			
		this.debug(`Validated successfully`);
	}
	
	static getJSONSchema() {
		return require( path.join(__dirname, '..', '..', 'assets', 'capability', 'schema.json' ) );	
	}
	
}

module.exports = Capability;