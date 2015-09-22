var Waterline = require('waterline');

var Role = Waterline.Collection.extend({
	identity: 'role',
	connection: 'default',
	attributes: {
		name: {
			type: 'string',
			required: true,
			unique: true
		},
		permissions: {
			collection: 'permission',
			via: 'roles'
		},
		usersWithRole: {
			collection: 'userrole',
			via: 'role'
		}
	}
});


module.exports = Role;