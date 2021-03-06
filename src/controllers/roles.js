var 
	Promise = require('bluebird'),
	express = require('express'),
	hal = require('hal'),
	roleService = require('../services/roles'),
	authenticate = require('../middleware/authentication'),
	authorize = require('../middleware/authorization'),
	authorizationService = require('../services/authorization'),
	_ = require('lodash'),
	Controller = require('./Controller'),
	errors = require('../services/errors');

var 
	routes = {
		roles: '',
		role: '/:id',
		grant: '/:id/grant',
		revoke: '/:id/revoke',
		permissions: '/permissions'
	},
	controllerRoot = '/roles';

/**
 * Role Management Api controller
 */
var controller = new Controller(controllerRoot);

controller.routes = routes,
				
/**
* @api {get} /roles List all roles
* @apiName GetRoles
* @apiGroup Role
*/	
controller.getRoles = function(req, res, next) {
		
	roleService.roles().then(function(roles) {
		var resource = new hal.Resource({}, controller.getRoute(routes.roles));
		resource.link('create', controller.getRoute(routes.roles));
					
		var embedded = _.map(roles, function(role) {
			var res = new hal.Resource(role, controller.getRoute(routes.role, role.id));
			return res;
		});
		resource.embed("roles", embedded);
	
		return res.json(resource);
	}).catch(function(e) {
		return next(e);
	});
}
	
/**
* Get all built in permissions
*/
controller.getPermissions = function(req, res, next) {
	roleService.permissions().then(function(permissions) {
		var resource = new hal.Resource({permissions: permissions}, controller.getRoute(routes.permissions));
		return res.json(resource);
	}).catch(function(e) {
		return next(e);
	})
}
	
/**
* @api {post} /roles Create a new role
* @apiName CreateRole
* @apiGroup Role
* 
* @apiParam {string} name Name of new role
*/
controller.createRole = function(req, res, next) {
	var roleName = req.body.name || req.body;
	roleService.createRole(roleName).then(function(role) {
		var url = controller.getRoute(routes.role, role.id);
		var resource = new hal.Resource(role, url);
		resource.link('delete', url);
		resource.link('update', url);
		
		return res.json(resource);
	}).catch(function(e) {
		return next(e);
	});
}
	
/**
* @api {get} /roles/:id Get a role
* @apiName GetRole
* @apiGroup Role
* 
* @apiParam {number} id Role Id
* @apiError 400 Invalid request
* @apiError 404 Role not found
*/	
controller.getRole = function(req, res, next) {
	var id = parseInt(req.params.id);
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid role Id"});
	}	
	
	roleService.loadRole(id).then(function(role) {
		if (!role) { return res.json(404, "Role not found"); }
		
		var url = controller.getRoute(routes.role, role.id);
		var resource = new hal.Resource(role, controller.getRoute(routes.role, role.id));
		resource.link('delete', url);
		resource.link('update', url);
		
		return res.json(200, resource);	
	}).catch(errors.NotFoundError, function(e) {
		return res.json(404, {error: "Role not found"});
	}).catch(errors.ServiceError, function(e) {
		return res.json(400, {error: e.message});
	}).catch(function(e) {
		next(e);
	});
}
	
/**
* @api {put} /roles/:id Update a role
* @apiName UpdateRole
* @apiGroup Role
* 
* @apiParam {string} name New name of role
* 
* @apiError 400 Update model invalid
*/	
controller.updateRole = function(req, res, next) {
	var id = parseInt(req.params.id);
	
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid role Id"});
	}
	
	roleService.updateRole(id, req.body).then(function(role) {
		return res.json(role);
	}).catch(errors.NotFoundError, function(e) {
		return res.json(404, {error: "Role not found"});		
	}).catch(errors.ServiceError, function(e) {
		return res.json(400, { error: e.message })
	}).catch(function(e) {
		next(e);
	});
}
	
/**
* @api {delete} /roles/:id Delete a role
* @apiName DeleteRole
* @apiGroup Role
*
* @apiError 400 Invalid role id
* @apiError 404 Role not found
*/		
controller.deleteRole = function(req, res, next) {
	var id = parseInt(req.params.id);
	
	if (!id || isNaN(id)) {
		return res.json(400, {error: "Invalid role Id"});
	}
	
	roleService.deleteRole(id).then(function() {
		return res.json(204);
	}).catch(errors.NotFoundError, function(e) {
		return res.json(404, {error: "Role not found"});		
	}).catch(errors.ServiceError, function(e) {
		return res.json(400, { error: e.message })
	}).catch(function(e) {
		next(e);
	});
}
	
/**
 * Get controller route directory for a given user
 * @returns a promise
 */
controller.getDirectory = function(user) {		
	return authorizationService.checkPermission(user, 'manageRoles', '', true)
	.then(function(granted) {
		return granted ? 
			[
				new hal.Link('roles', { href: controller.getRoute(routes.roles) })
			] : []
	});
}
	
controller.init = function(app, root) {
	controller.root = (root || "") + controllerRoot;
	
	var router = express.Router();
	
	router.use(authenticate.token);
	router.use(authorize.requirePermission('manageRoles', true));
	
	router.get(routes.roles, controller.getRoles);
	router.get(routes.permissions, controller.getPermissions);
	router.post(routes.roles, controller.createRole);
	router.get(routes.role, controller.getRole);
	router.put(routes.role, controller.updateRole);	
	router.delete(routes.role, controller.deleteRole);	
		
	app.use(controller.root, router);		
	return controller;
}


module.exports = controller;