var	orm = require('../collections/orm');

var service = {
	users : orm.collections.user,
	
	find: function(email) {
		return service.users.findOne({email: email});
	},
	
	load: function(id) {
		return service.users.findOne({id: id});
	},
	
	create: function(user) {
		return service.users.create(user);
	},
	
	update: function(user) {
		return service.users.update({id: user.id}, user);
	},
	
	remove: function(id) {
		return service.users.udpate({id: id}, {deleted: true});
	}
}

module.exports = service;