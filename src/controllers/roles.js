var 
	Promise = require('bluebird'),
	express = require('express'),
	hal = require('hal'),
	roleService = require('../services/roles'),
	authenticate = require('../middleware/authentication'),
	authorize = require('../middleware/authorization'),
	_ = require('lodash');

/*
	Role Management Api.
*/
function RolesController(app, root) {
	
	var 
		self = this,
		controllerRoot = root + '/roles';
		
	self.routes = {
			roles: '',
			role: '/:id',
			grant: '/:id/grant',
			revoke: '/:id/revoke',
			permissions: '/permissions'
		}
		
	self.getRoute = function(route, id) {
		var url = controllerRoot + route;
		if (id) {
			url = url.replace(':id', id);
		}
		return url;
	}
			
	self.app = app;	
	
	/**
	 * @api {get} /roles List all roles
	 * @apiName GetRoles
	 * @apiGroup Role
	 */	
	self.getRoles = function(req, res, next) {
		
		roleService.roles().then(function(roles) {
			var resource = new hal.Resource({}, self.getRoute(self.routes.roles));
			resource.link('create', self.getRoute(self.routes.roles));
						
			var embedded = _.map(roles, function(role) {
				var res = new hal.Resource(role, self.getRoute(self.routes.role, role.id));
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
	self.getPermissions = function(req, res, next) {
		roleService.permissions().then(function(permissions) {
			var resource = new hal.Resource({permissions: permissions}, self.getRoute(self.routes.permissions));
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
	self.createRole = function(req, res, next) {
		roleService.createRole(req.body.name || req.body).then(function(role) {
			var url = self.getRoute(self.routes.role, role.id);
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
	 */	
	self.getRole = function(req, res, next) {
		return res.json(501, req.params.id)
	}
	
	/**
	 * @api {put} /roles/:id Update a role
	 * @apiName UpdateRole
	 * @apiGroup Role
	 * 
	 * @apiParam {string} name New name of role
	 */	
	self.updateRole = function(req, res, next) {
		var id = parseInt(req.params.id);
		
		if (!id || isNaN(id)) {
			return res.json(400, {error: "Invalid role Id"});
		}
		
		roleService.updateRole(id, req.body).then(function(role) {
			return res.json(role);
		}).catch(function(e) {
			next(e);
		});
	}
	
	/**
	 * @api {delete} /roles/:id Delete a role
	 * @apiName DeleteRole
	 * @apiGroup Role
	 */		
	self.deleteRole = function(req, res, next) {
		return res.json(501, req.params.id);
	}
	
	self.getDirectory = function(user) {		
			
		if (user && user.isAdmin) {
			return [
				new hal.Link('roles', { href: self.getRoute(self.routes.roles) })
			];
		}
	
		return [];
	}		
	
	var router = express.Router();
	router.use(authenticate.token);
	router.use(authorize.requirePermission('manageRoles', true));
	
	router.get(self.routes.roles, self.getRoles);
	router.get(self.routes.permissions, self.getPermissions);
	router.post(self.routes.roles, self.createRole);
	router.get(self.routes.role, self.getRole);
	router.put(self.routes.role, self.updateRole);	
	router.delete(self.routes.role, self.deleteRole);	
		
	app.use(controllerRoot, router);
}

exports.Controller = RolesController;