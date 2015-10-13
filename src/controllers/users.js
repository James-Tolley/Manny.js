var authenticate = require('../middleware/authentication'),
	authorize = require('../middleware/authorization'),
	Promise = require('bluebird'),
	hal = require('hal'),
	express = require('express'),
	_ = require('lodash'),
	userService = require('../services/users'),
	authService = require('../services/authorization'),
	Controller = require('./Controller'),
	rolesController = require('./roles')
	

var
	controllerRoot = '/users',
	routes = {
		users: '',
		user: '/:id',
		userPermissions: '/:id/permissions/:scope?',
		userRoles: '/:id/roles',
		userRole: '/:id/roles/:roleId/:scope?',
		admin: '/:id/admin'
	};
	
var controller = new Controller(controllerRoot);
	
controller.routes = routes;	
	
/**
* @api {get} /users List all users
* @apiName GetUsers
* @apiGroup User
*/
controller.getUsers = function(req, res, next) {
	userService.users().then(function(users) {
		var resource = new hal.Resource({}, controller.getRoute(routes.users));
		var emebedded = _.map(users, function(user) {
			var res = new hal.Resource(user.toSummary(), controller.getRoute(routes.user, user.id));
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
controller.getUser = function(req, res, next) {
	var id = parseInt(req.params.id);
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid user id"})
	}
	
	userService.loadUser(id)
	.then(function(user) {
		if (!user) {
			return res.json(400, {error: "User not found"});
		}
		
		var url = controller.getRoute(routes.user, user.id);
		var resource = new hal.Resource(user.toJSON(), url);
		resource.link('update', url);
		
		if (req.user.isAdmin && req.user.id !== user.id) {
			if (user.isAdmin) {
				resource.link('removeadmin', controller.getRoute(routes.admin, user.id));
			} else {
				resource.link('makeadmin', controller.getRoute(routes.admin, user.id));
			}
		}		
		
		resource.link('roles', controller.getRoute(routes.userRoles, user.id));		
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
controller.getUserRoles = function(req, res, next) {
	var id = parseInt(req.params.id);
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid user id"})
	}
	
	userService.getRolesForUser(id).then(function(userRoles) {
		
		var resource = new hal.Resource({}, controller.getRoute(routes.userRoles, id));
		var templateLink = controller.getRoute(routes.userRole, {
			id: id,
			roleId: '{roleId}',
			scope: '{scope}'
		});
		
		resource.link('add', {href: templateLink, templated: true});
		resource.link('remove', {href: templateLink, templated: true});
		
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
controller.addUserToRole = function(req, res, next) {
	var id = parseInt(req.params.id);
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid user id"})
	}
	
	var roleId = parseInt(req.params.roleId);
	if (!roleId || isNaN(roleId)) {
		return res.json(400, {error: "Invalid role id"});
	};
	
	userService.assignRoleToUser(id, roleId, req.params.scope).then(function(user) {
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
controller.removeUserFromRole = function(req, res, next) {
	var id = parseInt(req.params.id);
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid user id"})
	}
	
	var roleId = parseInt(req.params.roleId);
	if (!roleId || isNaN(roleId)) {
		return res.json(400, {error: "Invalid role id"});
	};
	
	userService.removeRoleFromUser(id, roleId, req.params.scope)
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
controller.makeAdmin = function(req, res, next) {
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
controller.removeAdmin = function(req, res, next) {
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
controller.getPermissions = function(req, res, next) {
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
	
controller.getDirectory = function(user) {		
		
	return authService.checkPermission(user, 'manageUsers', '', true)
	.then(function(granted) {
		return granted ? 
			[
				new hal.Link('users', { href: controller.getRoute(routes.users) })
			] : []
	});
}

controller.init = function(app, root) {
	controller.root = (root || "") + controllerRoot;
	
	var router = express.Router();
	router.use(authenticate.token);
	
	router.get(routes.users, authorize.requirePermission('manageUsers', true), controller.getUsers);
	router.get(routes.user, authorize.requirePermission('manageUsers', true), controller.getUser);
	router.post(routes.admin, authorize.requireAdmin, controller.makeAdmin);
	router.delete(routes.admin, authorize.requireAdmin, controller.removeAdmin);
	router.get(routes.userPermissions, authorize.requirePermission('manageUsers', true), controller.getPermissions);
	router.get(routes.userRoles, authorize.requirePermission('manageUsers', true), controller.getUserRoles);
	router.post(routes.userRole, authorize.requirePermission('manageUsers', true), controller.addUserToRole);
	router.delete(routes.userRole, authorize.requirePermission('manageUsers', true), controller.removeUserFromRole);
	app.use(controller.root, router);
	
	return controller;
}

module.exports = controller;