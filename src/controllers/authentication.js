var authService = require('../services/authentication'),
	passport = require('passport'),
	Promise = require('bluebird'),
	hal = require('hal'),
	Controller = require('./Controller');

function AuthenticationController(routePrefix) {

	var self = this;

	var routes = {
		"login": { rel: "login", href: routePrefix + '/token', auth: authService.basicAuth, method: 'post', action: self.token },
		"register": { rel: "register", href: routePrefix + '/register', method: 'post', action: self.register },
		"me": { rel: "me", href: routePrefix + '/me', auth: authService.tokenAuth, method: 'get', action: self.me}
	}	

	Controller.call(this, routes);

	this.constructor = AuthenticationController;	
}

AuthenticationController.prototype = Object.create(Controller.prototype);

AuthenticationController.prototype.getDirectory = function(user) {
		
	if (user) {
		return [
			this.routes.me
		]
	}

	return [
		this.routes.login,
		this.routes.register
	]
}

AuthenticationController.prototype.token = function(req, res) {
	if (!req.user) {
		return res.json(401);
	}

	Promise.resolve(authService.issueToken(req.user)).then(function(token) {
		return res.json({
			user_id: req.user.id,
			user_name: req.user.name,
			email: req.user.email,
			access_token: token
		});	
	});
}

AuthenticationController.prototype.register = function(req, res) {
	if (req.user) {
		return res.json(400, 'User already exists')
	}

	return res.json({
		message: 'Account created. Woo'
	});
}

AuthenticationController.prototype.me = function(req, res) {
	if (!req.user) {
		return res.json(400, 'User not found');
	}

	var userInfo = {
		user_id : req.user.id,
		user_name : req.user.name,
		email : req.user.email
	}

	return res.json(userInfo);
}

exports.Controller = AuthenticationController;