'use strict';

const Capability = require('..').Capability;
const capability = new Capability({
	title: {
		en: 'My Capability',
		nl: 'Mijn Capability',
	},
	type: 'enum',
	values: [
		{
			id: 'foo',
			title: {
				en: 'bar'
			}
		}
	],
	getable: true,
	setable: true,
	decimals: 2,
});

capability.validate({
	debug: true,
}).then(() => {
	console.log('Capability validated successfully');
}).catch( err => {
	console.error('Capability did not validate');
	console.error( err );
})