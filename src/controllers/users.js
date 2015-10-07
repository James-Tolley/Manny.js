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
		userRoles: '/:id/roles',
		userRole: '/:id/roles/:roleId/:scope?',
		admin: '/:id/admin'
	}
	
	self.getRoute = function(route, id) {
		var url = controllerRoot + route;
		if (id) {
			url = url.replace(':id', id);
		}
		return url;
	}	
	
	/**
	 * @api {get} /users List all users
	 * @apiName GetUsers
	 * @apiGroup User
	 */
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
	
	/**
	 * @api {get} /users/:id Get a single user
	 * @apiName GetUser
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User id 
	 */
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
					resource.link('removeadmin', self.getRoute(self.routes.admin, user.id));
				} else {
					resource.link('makeadmin', self.getRoute(self.routes.admin, user.id));
				}
			}		
			
			resource.link('roles', self.getRoute(self.routes.userRoles, user.id));		
			return res.json(resource);		
		}).catch(function(e) {
			next(e);
		})
	}
	
	/**
	 * @api {get} /users/:id/roles Get all roles for a user
	 * @apiName GetUserRoles
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User id
	 */
	self.getUserRoles = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		
		userService.getRolesForUser(id).then(function(userRoles) {
			
			var resource = new hal.Resource({}, self.getRoute(self.routes.userRoles, id));
			var templateLink = self.getRoute(self.routes.userRole, id);
			templateLink = templateLink.replace(':roleId', '{roleId}').replace(':scope?', '{scope}');
			
			resource.link('addRole', {href: templateLink, templated: true});
			resource.link('removeRole', {href: templateLink, templated: true});
			
			var embedded = _.map(userRoles, function(ur) {
				var res = new hal.Resource(ur, rolesController.getRoute(rolesController.routes.role, ur.role));
				return res;
			});
			
			resource.embed("roles", embedded);
			
			return res.json(resource); 
		});		
	}
	
	/**
	 * @api {post} /users/:id/roles/:roleId/:scope? Add a user to a role. 
	 * @apiName AddUserToRole
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User Id
	 * @apiParam {number} roleId Role Id
	 * @apiParam {string} [scope] Optionally limited role to this scope only.
	 */
	self.addUserToRole = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		
		var roleId = parseInt(req.params.roleId);
		if (!roleId || isNaN(roleId)) {
			return res.json(400, {error: "Invalid role id"});
		};
		
		userService.assignRoleToUser(id, roleId, req.scope).then(function(user) {
			return res.json(user.roles); //todo: halify this
		});	
	}
	
	/**
	 * @api {delete} /users/:id/roles/:roleId/:scope? Remove a role from a user
	 * @apiName RemoveUserFromRole
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User Id
	 * @apiParam {number} roleId Role Id
	 * @apiParam {string} [scope] Remove role from this scope. 
	 * Leave blank to remove globally
	 */
	self.removeUserFromRole = function(req, res, next) {
		var id = parseInt(req.params.id);
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid user id"})
		}
		
		var roleId = parseInt(req.params.roleId);
		if (!roleId || isNaN(roleId)) {
			return res.json(400, {error: "Invalid role id"});
		};
		
		userService.removeRoleFromUser(id, roleId, req.scope)
		.then(function(user) {
			return res.json(user.roles); //todo: halify this
		});			
	}
	
	/**
	 * @api {post} /users/:id/admin Make a user system admin
	 * @apiName MakeAdmin
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User id
	 */
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
	
	/**
	 * @api {delete} /users/:id/admin Remove admin from a user
	 * @apiName RemoveAdmin
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User Id
	 */
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
	
	/**
	 * @api {get} /users/:id/permissions/:scope? Get all permissions a user has at a particular scope
	 * @apiName GetPermissions
	 * @apiGroup User
	 * 
	 * @apiParam {number} id User Id
	 * @apiParam {string} [scope] Optionally return permissions available at a particular scope. 
	 * If not specified only global permissions are returned.
	 */
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
	router.post(self.routes.admin, authorize.requireAdmin, self.makeAdmin);
	router.delete(self.routes.admin, authorize.requireAdmin, self.removeAdmin);
	router.get(self.routes.userPermissions, authorize.requirePermission('manageUsers', true), self.getPermissions);
	router.get(self.routes.userRoles, authorize.requirePermission('manageUsers', true), self.getUserRoles);
	router.post(self.routes.userRole, authorize.requirePermission('manageUsers', true), self.addUserToRole);
	router.delete(self.routes.userRole, authorize.requirePermission('manageUsers', true), self.removeUserFromRole);
	app.use(controllerRoot, router);
}

exports.Controller = UsersController;