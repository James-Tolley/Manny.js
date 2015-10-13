var Promise = require('bluebird'),
	_ = require('lodash'),
	orm = require('../collections/orm'),
	userService = require('./users'),
	roles = orm.collections.role,
	permissions = orm.collections.permission;
	
/**
 * User activity authorization
 */
var service = {
		
	/**
	 * Check that a user has a permission within a given scope.
	 * @param user Requesting user
	 * @param permissionName Name of permission required
	 * @param scope scope in which permission is required. If this is blank then permission is required globally.
	 * @param allowAdmin set to truthy to automatically allow admin users
	 * 
	 * @returns Promise 
	 */
	checkPermission: function(user, permissionName, scope, allowAdmin) {
		if (!user) { return Promise.resolve(false); }
		
		if (allowAdmin && user.isAdmin) {
			return Promise.resolve(true);
		}
		
		return service.getPermissionsAtScope(user.id, scope)
		.then(function(permissions) {
			var found = _.find(permissions, {name: permissionName});
			return !!found;
		});
	},
	
	/**
	 * Get all permissions for a user at a given scope
	 * @param {number} userId Id of user to retrieve permissions for
	 * @param {string} scope Scope for which permissions are required. 
	 */
	getPermissionsAtScope: function(userId, scope) {
		return userService.getRolesForUser(userId)
		.then(function(userRoles) {
			var rolesAtScope = _.filter(userRoles, function(userRole) {
				return (!userRole.scope || userRole.scope == "" || userRole.scope == scope);
			});
			return roles.find({id: _.pluck(rolesAtScope, 'role')}).populate('permissions');
		}).then(function(roles) {
		
			var permissions = _.chain(roles)
			.pluck('permissions')
			.flatten()
			.uniq('id')
			.value();
			
			return permissions;
		});
	} 
}

module.exports = service;