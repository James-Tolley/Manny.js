var Waterline = require('waterline');

var Permission = Waterline.Collection.extend({
	identity: 'permission',
	connection: 'default',
	attributes: {
		name: {
			type: 'string',
			required: true,
			unique: true
		},
		description: {
			type: 'string'
		},
		isGlobal: {
			type: 'boolean',
			required: true,
			defaultsTo: false
		},
		roles: {
			collection: 'role',
			via: 'permissions'
		}
	}
});


module.exports = Permission;