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
		},
		toSummary: function() {
			return {
				id: this.id,
				email: this.email,
				name: this.name
			}
		},
		toJSON: function() {
			var obj = this.toObject();
			delete obj.salt;
			delete obj.password;
			return obj;	
		}
	}
});

module.exports = User;