var Promise = require('bluebird');

/**
 * User activity authorization
 */
var service = {

	/**
	 * Generate middleware to require permission.
	 * @param permissioName name of permission required to continue
	 * @param allowAdmin Automatically grant access to admin users. Defaults to false
	 */
	requirePermission: function(permissionName, allowAdmin) {
		return function(req, res, next) {
			if (allowAdmin && req.user.isAdmin) {
				next();
			} else {
				service.checkPermission(req.user, permissionName, req.authorizationScope)
				.then(function(granted) {
					if (granted) { next() }
					else {
						res.status(403).send('Access denied');
					}
				});
			}
		}
	},	
	
	/**
	 * Specifically require a user to be an admin to perform this action
	 */
	requireAdmin: function(req, res, next) {
		if (req.user.isAdmin) {
			return next();
		} else {
			return res.status(403).send('Access Denied');
		}
	},
		
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