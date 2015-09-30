var Promise = require('bluebird');

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
		// Dummy code
		return Promise.resolve(false);
	}
}

module.exports = service;