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
	 * @scope scope in which permission is required. If this is blank then permission is required globally.
	 */
	checkPermission: function(user, permissionName, scope) {
		return service.getPermissionsAtScope(user.id, scope)
		.then(function(permissions) {
			return _.find(permissions, {name: permissionName});
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
			userRoles = _.filter(userRoles, function(userRole) {
				return (!userRole.scope || userRole.scope == "" || userRole.scope == scope);
			});
			
			return roles.find({id: _.pluck(userRoles, 'role')}).populate('permissions');
		}).then(function(permissions) {
			return permissions;
		});
	} 
}

module.exports = service;