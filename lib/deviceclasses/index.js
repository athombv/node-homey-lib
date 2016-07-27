"use strict";

const path	= require('path');

const allowedCapabilityTypes = [ 'boolean', 'number', 'enum', 'string' ];

module.exports.getDeviceClasses = function(){
	return require( path.join( __dirname, 'deviceclasses.json' ) );
}

module.exports.validateCapability = function( capability ) {

	var errors = [];

	function error( msg ) {
		errors.push( msg );
	}

	// type
	if( typeof capability.type === 'undefined' )
		error('missing_capability_type');

	if( allowedCapabilityTypes.indexOf( capability.type ) < 0 )
		error('invalid_capability_type');

	// getable
	if( typeof capability.getable !== 'boolean' )
		error('invalid_getable');

	// setable
	if( typeof capability.setable !== 'boolean' )
		error('invalid_setable');

	// title
	if( typeof capability.title === 'object' ) {
		if( typeof capability.title.en !== 'string' )
			error('invalid_title.en');

		for( let lang in capability.title ) {
			if( typeof capability.title[lang] !== 'string' )
				error(`invalid_title.${lang}`);
		}
	} else {
		error('invalid_title');
	}

	// number-specific
	if( capability.type === 'number' ) {

		// decimals
		if( typeof capability.decimals !== 'undefined' ) {
			if( typeof capability.decimals === 'number' ) {
				if( capability.decimals < 0 || capability.decimals > 18 )
					error('decimals_out_of_bounds');
			} else {
				error('invalid_decimals')
			}
		}

		// units
		if( typeof capability.units !== 'undefined' ) {
			if( typeof capability.units === 'object' ) {
				if( typeof capability.units.en !== 'string' )
					error('invalid_units.en');

				for( let lang in capability.units ) {
					if( typeof capability.units[lang] !== 'string' )
						error(`invalid_units.${lang}`);
				}
			} else {
				error('invalid_units')
			}
		}
	}

	// enum-specific
	if( capability.type === 'enum' ) {
		if( typeof capability.values !== 'undefined' ) {
			if( Array.isArray(capability.values) ) {

				var foundIds = [];
				capability.values.forEach(function(value, i){

					if( typeof value.id !== 'string' )
						return error(`invalid_values[${i}].id`);

					if( foundIds.indexOf(value.id) > -1 )
						return error(`duplicate_values[${i}].id`);

					foundIds.push(value.id);

					if( typeof value.title === 'object' ) {
						if( typeof value.title.en !== 'string' )
							error(`invalid_values[${i}].title.en`);

						for( let lang in value.title ) {
							if( typeof value.title[lang] !== 'string' )
								error(`invalid_values[${i}].title.${lang}`);
						}
					} else {
						error('invalid_title');
					}
				})
			} else {
				error('invalid_values');
			}
		} else {
			error('missing_values');
		}
	}

	if( errors.length === 0 ) return true;
	return errors;

}