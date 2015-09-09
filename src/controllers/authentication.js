var 
	Promise = require('bluebird'),
	hal = require('hal'),
	authService = require('../services/authentication');

function AuthenticationController(app, root) {

	var 
		self = this,
		routes = {
			login: root + '/token',
			register: root + '/register',
			me: root + '/me'
		}
			
	self.app = app;

	self.token = function(req, res) {
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

	self.register = function(req, res) {

		authService.register(req.body).then(function(user) {
			var resource = new hal.Resource(user, routes.me);
			resource.link('login', routes.login);

			return res.json(resource);
		}).catch(function(err) {
			return res.json(400, {message: err.message});
		})
	}

	self.me = function(req, res) {
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
	
	// Return available actions for root directory
	self.getDirectory = function(user) {		
			
		if (user) {
			return [
				new hal.Link('me', { href: routes.me })
			]
		}
	
		return [
			new hal.Link('login', {href: routes.login}),
			new hal.Link('register', {href: routes.register})
		]
	}	
	
	app.post(routes.login, authService.basicAuth, self.token);
	app.post(routes.register, self.register);
	app.get(routes.me, authService.tokenAuth, self.me);
}

exports.Controller = AuthenticationController;