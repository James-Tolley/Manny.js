var authService = require('../services/authorization');

/**
* Generate middleware to require permission.
* @param permissioName name of permission required to continue
* @param allowAdmin Automatically grant access to admin users. Defaults to false
*/
exports.requirePermission = function(permissionName, allowAdmin) {
	return function(req, res, next) {
	
		authService.checkPermission(req.user, permissionName, req.authorizationScope, allowAdmin)
		.then(function(granted) {
			if (granted) { next() }
			else {
				res.status(403).send('Access denied');
			}
		});
	
	}
}
	
/**
* Specifically require a user to be an admin to perform this action
*/
exports.requireAdmin = function(req, res, next) {
	if (req.user.isAdmin) {
		return next();
	} else {
		return res.status(403).send('Access Denied');
	}
}