var Waterline = require('waterline'),
	crypto = require('crypto');

var User = Waterline.Collection.extend({
	identity: 'user',
	connection: 'default',
	attributes: {
		email: {
			type: 'email',
			unique: true,
		},

		name: 'string',
		password: 'string',
		salt: 'string',
		isAdmin: {
			type: 'boolean',
			defaultsTo: false
		},
		deleted: {
			type: 'boolean',
			defaultsTo: false,
		},
		roles: {
			collection: 'userrole',
			via: 'user'
		}
	}
});

module.exports = User;