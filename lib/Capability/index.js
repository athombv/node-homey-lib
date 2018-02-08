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
	
	async validate({
		debug = false
	} = {}) {
		this._debug = debug;
		
		this.debug(`Validating capability`);
		
		const schema = Capability.getJSONSchema();
		const avj = new Ajv({ async: true });
		const validate = avj.compile( schema );
		const valid = validate( this._capability );
		if( valid === false ) throw new Error( JSON.stringify(validate.errors, false, 4) || 'Invalid Capability' );
			
		this.debug(`Validated successfully`);
	}
	
	static getJSONSchema() {
		return require( path.join(__dirname, '..', '..', 'assets', 'capability', 'schema.json' ) );	
	}
	
}

module.exports = Capability;