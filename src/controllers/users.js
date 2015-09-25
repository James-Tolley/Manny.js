var authenticate = require('../middleware/authentication'),
	authorize = require('../middleware/authorization'),
	Promise = require('bluebird'),
	hal = require('hal'),
	express = require('express'),
	userService = require('../services/users');

function UsersController(app, root) {
	
	var self = this,
	controllerRoot = root + '/users',
	routes = {
		users: root + '',
		user: root + '/:id',
		userRoles: root + '/:id/roles'
	}
	
	self.getUsers = function(req, res, next) {
		userService.users().then(function(users) {
			var resource = new hal.Resource(users, routes.users);
			return res.json(resource);	
		}).catch(function(e) {
			next(e);
		});
	}
	
	var router = express.Router();
	router.use(authenticate.token);
	
	router.get(routes.users, authorize.requirePermission('manageUsers', true), self.getUsers);
	app.use(controllerRoot, router);
}


module.exports = UsersController;