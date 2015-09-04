var authService = require('../services/authentication'),
	passport = require('passport'),
	Promise = require('bluebird'),
	hal = require('hal'),
	Controller = require('./Controller');

function UsersController(routePrefix) {
	
	var self = this;
	
	this.listUsers = function(req, res) {
		var users = userService.all();
		
		res.json(users);
	}
	
	var routes = {
		"list": { rel: "users", href: routePrefix + '/users', auth: authService.tokenAuth, method: 'get', action: self.listUsers }
	}
	
	Controller.call(this, routes);
	this.constructor = UsersController;	
	
}

UsersController.prototype = Controller.prototype

module.exports = UsersController;