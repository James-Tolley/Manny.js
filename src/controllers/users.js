var authenticate = require('../middleware/authentication'),
	authorize = require('../middleware/authorization'),
	Promise = require('bluebird'),
	hal = require('hal'),
	express = require('express'),
	_ = require('lodash'),
	userService = require('../services/users');

function UsersController(app, root) {
	
	var self = this,
	controllerRoot = root + '/users',
	routes = {
		users: '',
		user: '/:id',
		userRoles: '/:id/roles',
		makeAdmin: '/:id/makeadmin',
		removeAdmin: '/:id/removeadmin'
	}
	
	function getRoute(route, id) {
		var url = controllerRoot + route;
		if (id) {
			url = url.replace(':id', id);
		}
		return url;
	}	
	
	self.getUsers = function(req, res, next) {
		userService.users().then(function(users) {
			var resource = new hal.Resource({}, getRoute(routes.users));
			var emebedded = _.map(users, function(user) {
				var res = new hal.Resource(user.toSummary(), getRoute(routes.user.replace(':id', user.id)));
				return res;
			});
			resource.embed("users", emebedded);
			
			return res.json(resource);	
		}).catch(function(e) {
			next(e);
		});
	}
	
	self.getUser = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		userService.loadUser(id)
		.then(function(user) {
			if (!user) {
				return res.json(400, {error: "User not found"});
			}
			
			var url = getRoute(routes.user, user.id);
			var resource = new hal.Resource(user.toJSON(), url);
			resource.link('update', url);
			resource.link('roles', getRoute(routes.userRoles, user.id));
			
			if (req.user.isAdmin && req.user.id !== user.id) {
				if (user.isAdmin) {
					resource.link('removeadmin', getRoute(routes.removeAdmin, user.id));
				} else {
					resource.link('makeadmin', getRoute(routes.makeadmin, user.id));
				}
			}
			
			return res.json(resource);
		}).catch(function(e) {
			next(e);
		})
	}
	
	self.makeAdmin = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		
		userService.loadUser(id)
		.then(function(user) {
			if (!user) {
				return res.json(400, {error: "User not found"});
			}
			
			userService.setAdmin(user, true).then(function(user) {
				return res.json(user);
			});
		});	
	}
	
	self.removeAdmin = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		
		if (req.user.id == id) {
			return res.json(400, {error: "Cannot remove yourself as admin"});
		}
		
		userService.loadUser(id)
		.then(function(user) {
			if (!user) {
				return res.json(400, {error: "User not found"});
			}
			
			userService.setAdmin(user, false).then(function(user) {
				return res.json(user);
			});
		});			
	}
	
	var router = express.Router();
	router.use(authenticate.token);
	
	router.get(routes.users, authorize.requirePermission('manageUsers', true), self.getUsers);
	router.get(routes.user, authorize.requirePermission('manageUsers', true), self.getUser);
	router.post(routes.makeAdmin, authorize.requireAdmin, self.makeAdmin);
	router.post(routes.removeAdmin, authorize.requireAdmin, self.removeAdmin);
	app.use(controllerRoot, router);
}

exports.Controller = UsersController;