var authenticate = require('../middleware/authentication'),
	authorize = require('../middleware/authorization'),
	Promise = require('bluebird'),
	hal = require('hal'),
	express = require('express'),
	_ = require('lodash'),
	userService = require('../services/users'),
	authService = require('../services/authorization'),
	rolesController = require('./roles');

function UsersController(app, root) {
	
	var self = this,
	controllerRoot = root + '/users';
	
	self.routes = {
		users: '',
		user: '/:id',
		userPermissions: '/:id/permissions/:scope?',
		makeAdmin: '/:id/makeadmin',
		removeAdmin: '/:id/removeadmin'
	}
	
	self.getRoute = function(route, id) {
		var url = controllerRoot + route;
		if (id) {
			url = url.replace(':id', id);
		}
		return url;
	}	
	
	self.getUsers = function(req, res, next) {
		userService.users().then(function(users) {
			var resource = new hal.Resource({}, self.getRoute(self.routes.users));
			var emebedded = _.map(users, function(user) {
				var res = new hal.Resource(user.toSummary(), self.getRoute(self.routes.user, user.id));
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
			
			var url = self.getRoute(self.routes.user, user.id);
			var resource = new hal.Resource(user.toJSON(), url);
			resource.link('update', url);
			
			if (req.user.isAdmin && req.user.id !== user.id) {
				if (user.isAdmin) {
					resource.link('removeadmin', self.getRoute(self.routes.removeAdmin, user.id));
				} else {
					resource.link('makeadmin', self.getRoute(self.routes.makeAdmin, user.id));
				}
			}			
			
			userService.getRolesForUser(id).then(function(userRoles) {
				
				var embedded = _.map(userRoles, function(ur) {
					var res = new hal.Resource(ur, rolesController.getRoute(rolesController.routes.role, ur.role));
					//res.link('delete', self.getRoute(self.routes.deleteRole))
					return res;
				});
				
				resource.embed("roles", embedded);
				
				return res.json(resource);
			});
			
			
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
	
	self.getPermissions = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		
		var scope = req.params.scope;
		authService.getPermissionsAtScope(id, scope)
		.then(function(permissions) {
			return res.json(permissions);
		})
	}
	
	self.getDirectory = function(user) {		
			
		if (user && user.isAdmin) {
			return [
				new hal.Link('users', { href: self.getRoute(self.routes.users) })
			];
		}
	
		return [];
	}			
	
	var router = express.Router();
	router.use(authenticate.token);
	
	router.get(self.routes.users, authorize.requirePermission('manageUsers', true), self.getUsers);
	router.get(self.routes.user, authorize.requirePermission('manageUsers', true), self.getUser);
	router.post(self.routes.makeAdmin, authorize.requireAdmin, self.makeAdmin);
	router.post(self.routes.removeAdmin, authorize.requireAdmin, self.removeAdmin);
	router.get(self.routes.userPermissions, authorize.requirePermission('manageUsers', true), self.getPermissions);
	app.use(controllerRoot, router);
}

exports.Controller = UsersController;