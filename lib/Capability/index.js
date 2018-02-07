'use strict';

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
			
		// TODO
			
		this.debug(`Validated successfully`);
	}
	
}

module.exports = Capability;