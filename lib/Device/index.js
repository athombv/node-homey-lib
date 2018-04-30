'use strict';

const path = require('path');

const deviceAssets = path.join(__dirname, '..', '..', 'assets', 'device' );

let classesCache;
let capabilitiesCache;

class Device {
	
	static getClasses() {
  	if( classesCache ) return classesCache;
  	
  	const classes = require(path.join(deviceAssets, 'classes.json'));
  	classesCache = classes.reduce((obj, classId) => {
      obj[classId] = require(path.join(deviceAssets, 'classes', `${classId}.json`))
      return obj;
  	}, {});
  	return classesCache;
	}
	
	static getCapabilities() {
  	if( capabilitiesCache ) return capabilitiesCache;
  	
  	const capabilities = require(path.join(deviceAssets, 'capabilities.json'));
  	capabilitiesCache = capabilities.reduce((obj, capabilityId) => {
      obj[capabilityId] = require(path.join(deviceAssets, 'capabilities', `${capabilityId}.json`))
      obj[capabilityId] = Device.composeCapability( capabilityId, obj[capabilityId] );
      return obj;
  	}, {});
  	return capabilitiesCache;
	}
	
	static composeCapability( capabilityId, capability ) {
  	if( capability.flow ) console.warn(`Warning: using \`capability.flow\` (${capabilityId}), expected a \`capability.$flow\``);
  	if( capability.$flow ) {
    	['triggers', 'conditions', 'actions'].forEach(type => {
      	const cards = capability.$flow[type];
      	if( !Array.isArray(cards) ) return;
      	cards.forEach(card => {
        	
        	if( Array.isArray(card.args) ) { 
          	card.args.forEach(arg => {
            	// allow `"values": "$values"` to copy values from the capability          	
            	if( arg.type === 'dropdown' ) {
              	if( arg.values === '$values' ) {
                	arg.values = capability.values;
            	  }
              }
            });
          }
          
          if( Array.isArray(card.tokens) ) {
          	card.tokens.forEach(token => {
            	if( token.name === '$id' )
              	token.name = capability.id;
              	
            	if( token.type === '$type' )
              	token.type = capability.type;
              	
              if( token.title === '$title' )
                token.title = capability.title;              
            });
          }
      	});
    	})
  	}
  	
  	return capability;
	}
	
}

module.exports = Device;