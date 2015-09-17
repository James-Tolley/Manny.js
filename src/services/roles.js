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
		return roles.findOne({name: name});
	},
	
	loadRole: function(id) {
		return roles.findOne({id: id});
	},
	
	checkDuplicates: function(name) {
		return name ? service.findRole(name) : Promise.resolve(null);
	},
	
	updateRole: function(id, role) {
		if (role.hasOwnProperty('name') && !role.name) {
			return Promise.reject(new Error("Role name cannot be blank"));
		}
		
		return service.checkDuplicates(role.name).then(function(r) {
			if (r && r.id !== id) {
				throw new Error("Role " + role.name + " already exists");
			}
			
			return roles.update({id: id}, role);
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