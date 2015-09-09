/*
	Role Management
*/

var 
	orm = require('../collections/orm'),
	Promise = require('bluebird');

var 
	users = orm.collections.user,
	roles = orm.collections.role,
	permissions = orm.collections.permission;

var service = {
	
	roles: function() {
		return roles.find();
	},
	
	findRole: function(name) {
		return roles.findOne({name: name});
	},
	
	loadRole: function(id) {
		return roles.findOne({id: id});
	},
	
	permissions: function() {
		return permissions.find();
	},
	
	createRole: function(name) {
		if (!name) { return Promise.reject(new Error("Role name is required")); }
		
		return service.findRole(name)
		.then(function(role) {
			if (role) { throw new Error("Role " + name + " already exists") }
			
			return roles.create({name: name});
		});
	},
	
	deleteRole: function(name) {
		return service.findRole(name)
		.then(function(role) {
			if (!role) { throw new Error("Role not found")}
			return roles.destroy({id: role.id});
		});
	}
}

module.exports = service;