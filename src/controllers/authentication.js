var 
	Promise = require('bluebird'),
	hal = require('hal'),
	auth = require('../middleware/authentication'),
	authService = require('../services/authentication'),
	userService = require('../services/users');

/**
 * Authentication Api Actions
 */
function AuthenticationController(app, root) {

	var 
		self = this,
		routes = {
			login: root + '/token',
			register: root + '/register',
			me: root + '/me'
		}
			
	self.app = app;

	/**
	 * @api {get} Get an authentication token for accessing secured methods
	 * @apiName Token
	 * @apiGroup Authentication
	 * @apiDescription Client must authenticate via basic authentication header on calling
	 * this method.
	 * 
	 * @apiSuccess user If the authentication details are valid, user details and access token are returned
	 * @apiError 401 Login failed
	 */
	self.token = function(req, res, next) {
		if (!req.user) {
			return res.json(401, "Login failed");
		}

		Promise.resolve(authService.issueToken(req.user)).then(function(token) {
			return res.json({
				user_id: req.user.id,
				user_name: req.user.name,
				email: req.user.email,
				access_token: token
			});	
		}).catch(function(e) {
			return next(e);
		});
	}

	/**
	 * @api {post} Register a new account
	 * @apiName Register
	 * @apiGroup Authentication
	 * 
	 * @apiParam {string} email Email address to be used for account login
	 * @apiParam {string} password Account password
	 * @apiParam {string} confirmPassword Repeated password. This must match password
	 * @apiParam {string} name User display name* 
	 * 
	 * @apiSuccess user Newly created account
	 * @apiError 400 User model was not valid. See body for error details 
	 */
	self.register = function(req, res, next) {

		userService.createUser(req.body).then(function(user) {
			var resource = new hal.Resource(user, routes.me);
			resource.link('login', routes.login);

			return res.json(resource);
		}).catch(function(e) {
			return next(e);
		});
	}

	/**
	 * @api {get} Retrieve current user details
	 */
	self.me = function(req, res, next) {
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
	
	app.post(routes.login, auth.basic, self.token);
	app.post(routes.register, self.register);
	app.get(routes.me, auth.token, self.me);
}

exports.Controller = AuthenticationController;