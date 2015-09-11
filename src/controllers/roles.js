var 
	Promise = require('bluebird'),
	hal = require('hal'),
	authService = require('../services/authentication');

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
	
	self.getRoles = function(req, res) {
		return res.json(501);
	}
	
	self.createRole = function(req, res) {
		return res.json(501, req.body);
	}
	
	self.getRole = function(req, res) {
		return res.json(501, req.params.id)
	}
	
	self.updateRole = function(req, res) {
		return res.json(501, {
			id: req.params.id,
			update: req.body
		});
	}
	
	self.deleteRole = function(req, res) {
		return res.json(501, req.params.id);
	}
	
	app.get(routes.roles, authService.tokenAuth, self.getRoles);
	app.post(routes.roles, authService.tokenAuth, self.createRole);
	app.get(routes.role, authService.tokenAuth, self.getRole);
	app.put(routes.role, authService.tokenAuth, self.updateRole);	
	app.delete(routes.role, authService.tokenAuth, self.deleteRole);
}

module.exports = RolesController;