var 
	Promise = require('bluebird'),
	hal = require('hal'),
	roleService = require('../services/roles'),
	authService = require('../services/authentication'),
	authorization = require('../services/authorization'),
	_ = require('lodash');

/*
	Role Management Api.
*/
function RolesController(app, root) {
	
	var 
		self = this,
		routes = {
			roles: root + '/roles',
			role: root + '/roles/:id',
			grant: root + '/roles/:id/grant',
			revoke: root + '/roles/:id/revoke'
		}
			
	self.app = app;	
	
	/**
	 * @api {get} /roles List all roles
	 * @apiName GetRoles
	 * @apiGroup Role
	 */	
	self.getRoles = function(req, res, next) {
		
		roleService.roles().then(function(roles) {
			var resource = new hal.Resource({}, routes.roles);
			resource.link('create', routes.roles);
						
			var embedded = _.map(roles, function(role) {
				var res = new hal.Resource(role, routes.role.replace(':id', role.id));
				return res;
			});
			resource.embed("roles", embedded);
		
			return res.json(resource);
		}).catch(function(e) {
			return next(e);
		});
		
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
			var url = routes.role.replace(':id', role.id);
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
			return res.json(400, "Invalid role Id");
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
				new hal.Link('roles', { href: routes.roles })
			];
		}
	
		return [];
	}		
	
	//todo: There's probably a better way to do this with routers and wildcard middleware
	app.get(routes.roles, authService.tokenAuth, authorization.requirePermission('manageRoles', true), self.getRoles);
	app.post(routes.roles, authService.tokenAuth, authorization.requirePermission('manageRoles', true), self.createRole);
	app.get(routes.role, authService.tokenAuth, authorization.requirePermission('manageRoles', true), self.getRole);
	app.put(routes.role, authService.tokenAuth, authorization.requirePermission('manageRoles', true), self.updateRole);	
	app.delete(routes.role, authService.tokenAuth, authorization.requirePermission('manageRoles', true), self.deleteRole);
}

exports.Controller = RolesController;