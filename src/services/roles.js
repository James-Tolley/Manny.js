var 
	orm = require('../collections/orm'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	errors = require('./errors');

var roles = orm.collections.role,
	permissions = orm.collections.permission;

/**
 * Role Management
 */
var service = {
	
	/**
	 * Get all roles
	 * 
	 * @returns {Array} Promise which resolves with all roles.
	 */
	roles: function() {
		return roles.find();
	},
	
	/**
	 * Find a role by its name
	 * 
	 * Will automatically return null if the name is empty.
	 * 
	 * @param {string} name Role name
	 * @returns Promise which resolves with the found role, or null if not found.
	 */
	findRole: function(name) {
		return name ? roles.findOne({name: name}) : Promise.resolve(null);
	},
	
	/**
	 * Load a role by id.
	 * 
	 * @param {number} id Role id
	 * @returns Promise which resolves with the found Role, or null if it does not exist
	 * @throws {NotFoundError} Role id does not exist
	 */
	loadRole: function(id) {
		return roles.findOne({id: id}).then(function(role) {
			if (!role) {
				throw new errors.NotFoundError("Role does not exist");
			}
			return role;
		});
	},
		
	/**
	 * Update a role
	 * 
	 * @param {number} id Id of role to update
	 * @param model Properties to update. This does not have to be a complete model
	 * @returns Promise which will resolve with an updated role model
	 * 
	 * @throws {ServiceError} Name was passed but empty, or another role with that name already exists
	 * @throws {NotFoundError} Role id does not exist
	 */
	updateRole: function(id, model) {
		
		if (model.hasOwnProperty('name') && !model.name) {
			return Promise.reject(new errors.ServiceError("Role name cannot be blank"));
		}
		
		return service.findRole(model.name).then(function(r) {
			if (r && (r.id != id)) {
				throw new errors.ServiceError("Role " + model.name + " already exists");
			}
				
			return service.loadRole(id);			

		}).then(function(role) {
			role.name = model.name || role.name;
			return role.save();
		})
	},
	
	/**
	 * List all permissions in the system
	 * 
	 * @returns {Array} Promise which resolves with all permissions
	 */
	permissions: function() {
		return permissions.find();
	},
	
	/**
	 * Find a permission by name
	 * 
	 * @param {String} name Name of the permission
	 * @returns Promise which resolves with the permission, or null if not found
	 */
	findPermission: function(name) {
		return permissions.findOne({name: name});
	},
	
	/**
	 * Create a new role
	 * @param {string} name Name of the new role
	 * @returns Promise which resolves with the newly created role
	 * @throws {ServiceError} Name is blank, or already exists
	 */
	createRole: function(name) {
		if (!name) { return Promise.reject(new errors.ServiceError("Role name is required")); }
		
		return service.findRole(name)
		.then(function(role) {
			if (role) { throw new errors.ServiceError("Role " + name + " already exists") }
			
			return roles.create({name: name});
		});
	},
	
	/**
	 * Delete a role by Id
	 * @param {number} id Id of role to delete
	 * @throws {NotFoundError} Role not found
	 */
	deleteRole: function(id) {
		return service.loadRole(id)
		.then(function(role) {
			return roles.destroy({id: role.id});
		});
	},
	
	/**
	 * Grant permission to a role
	 * @param {String} roleName Name of role to grant permission to
	 * @param {String} permissionName Name of permission to grant
	 * 
	 * @returns Promise which resolves with updated role model
	 * @throws {NotFoundError} Role does not exist
	 * @throws {NotFoundError} Permission does not exist
	 * @throws {ServiceError} Role already has this permission
	 * @throws {ServiceError} Attempted to assign a global permission to a role which already contains scopeable ones, or vice versa 
	 */
	grantPermission: function(roleName, permissionName) {
		return Promise.all([
			roles.findOne({name: roleName}).populate('permissions'),
			permissions.findOne({name: permissionName})
		])
		.spread(function(role, permission) {
			if (!role) { throw new errors.NotFoundError("Role does not exist"); }
			if (!permission) { throw new errors.NotFoundError("Permission does not exist"); }
			
			var existingPermission = _.find(role.permissions, { name: permissionName });
			if (existingPermission) {
				throw new errors.ServiceError("Role already has this permission");
			}
				
			var scopeConflict = _.find(role.permissions, { isGlobal: !permission.isGlobal });
			if (scopeConflict) {
				throw new errors.ServiceError("Cannot mix global and scopeable permissions in a single role");
			}
			
			role.permissions.add(permission);
			return role.save();
		});
	},
	
	/**
	 * Remove permission from a role
	 * @param {string} roleName Name of role to remove permission from
	 * @param {string} permissioName name of permission to remove
	 * 
	 * @return Promise which resolves with the updated role model
	 * @throws {NotFoundError} Role does not exist
	 * @throws {NotFoundError} Permission does not exist
	 * @throws {ServiceError} Role does not have this permission
	 */
	removePermission: function(roleName, permissionName) {
		return Promise.all([
			roles.findOne({name: roleName}).populate('permissions'),
			permissions.findOne({name: permissionName})
		])
		.spread(function(role, permission) {
			if (!role) { throw new errors.NotFoundError("Role does not exist"); }
			if (!permission) { throw new errors.NotFoundError("Permission does not exist"); }
			
			var existingPermission = _.find(role.permissions, { name: permissionName });
			if (!existingPermission) {
				throw new errors.ServiceError("Role does not have this permission");
			}			
			
			role.permissions.remove(existingPermission.id);
			return role.save();
		});
	}
}

module.exports = service;