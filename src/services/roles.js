/*
	Role Management
*/

var 
	orm = require('../collections/orm'),
	Promise = require('bluebird'),
	_ = require('lodash');

var 
	users = orm.collections.user,
	roles = orm.collections.role,
	permissions = orm.collections.permission;

var service = {
	
	roles: function() {
		return roles.find();
	},
	
	findRole: function(name) {
		return name ? roles.findOne({name: name}) : Promise.resolve(null);
	},
	
	loadRole: function(id) {
		return roles.findOne({id: id});
	},
		
	updateRole: function(id, model) {
				
		if (model.hasOwnProperty('name') && !model.name) {
			return Promise.reject(new Error("Role name cannot be blank"));
		}
		
		return service.findRole(model.name).then(function(r) {
			if (r && (r.id !== id)) {
				throw new Error("Role " + model.name + " already exists");
			}
	
			return service.loadRole(id);			

		}).then(function(role) {
			role.name = model.name || role.name;
			return role.save();
		})
	},
	
	permissions: function() {
		return permissions.find();
	},
	
	findPermission: function(name) {
		return permissions.findOne({name: name});
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
	},
	
	grantPermission: function(roleName, permissionName) {
		return Promise.all([
			roles.findOne({name: roleName}).populate('permissions'),
			permissions.findOne({name: permissionName})
		])
		.spread(function(role, permission) {
			if (!role) { throw new Error("Role does not exist"); }
			if (!permission) { throw new Error("Permission does not exist"); }
			
			var existingPermission = _.find(role.permissions, { name: permissionName });
			if (existingPermission) {
				throw new Error("Role already has this permission");
			}
				
			var scopeConflict = _.find(role.permissions, { isGlobal: !permission.isGlobal });
			if (scopeConflict) {
				throw new Error("Cannot mix global and scopeable permissions in a single role");
			}
			
			role.permissions.push(permission);
			return role.save();
		})
	}
}

module.exports = service;