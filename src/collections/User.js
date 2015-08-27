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
	
		checkPassword: function(password) {
			return this.hashPassword(password) == this.password;
		},

		hashPassword: function(password) {
			return crypto.pbkdf2Sync(password, this.salt, 4096, 256).toString('hex');
		}
	}
});




module.exports = User;