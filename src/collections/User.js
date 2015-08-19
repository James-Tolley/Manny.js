var Waterline = require('waterline');

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
		salt: 'string'
	}
});

module.exports = User;