var Waterline = require('waterline');

var UserRole = Waterline.Collection.extend({
	identity: 'userrole',
	connection: 'default',
	attributes: {
		scope: 'string',
		user: {
			model: 'user',
			via: 'roles'
		},
		role: {
			model: 'role',
			via: 'userswithrole'
		}
	}
});


module.exports = UserRole;