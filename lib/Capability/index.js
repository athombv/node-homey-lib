'use strict';

const path = require('path');
const Ajv = require('ajv');

class Capability {
	
	constructor( capability ) {
		this._capability = capability;
		this._avj = new Ajv();
		this._validate = this._avj.compile( this._getSchema() );
	}
	
	debug(...args) {
		if( !this._debug ) return;
		console.log('[dbg]', ...args);
	}
	
	async validate({ debug = false }) {
		this._debug = debug;
		
		this.debug(`Validating capability`);
		
		const valid = this._validate( this._capability );
		if( !valid )
			throw new Error( this._avj.errors || 'Invalid Capability' )
			
		this.debug(`Validated successfully`);
	}
	
	_getSchema() {
		return require( path.join(__dirname, '..', '..', 'assets', 'capability', 'schema.json' ) );	
	}
	
}

module.exports = Capability;