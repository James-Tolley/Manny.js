var 
	Promise = require('bluebird'),
	hal = require('hal'),
	express = require('express'),
	authenticate = require('../middleware/authentication'),
	authService = require('../services/authentication'),
	userService = require('../services/users'),
	routing = require('../lib/routing'),
	ServiceError = require('../services/ServiceError');

var 
	routes = {
		login: '/token',
		register: '/register',
		me: '/me'
	},
	controllerRoot = '';
	
/**
 * Authentication Api Actions
 */
var controller = {
		
	root: controllerRoot,
	routes: routes,		
	getRoute: function(route, params) {
		var url = (controller.root || "") + route;
		
		if (params) {
			url = routing.getRoute(url, params);
		}
		return url;
	},		
			
	
	/**
	 * @api {get} /token Get an authentication token for accessing secured methods
	 * @apiName Token
	 * @apiGroup Authentication
	 * @apiDescription Client must authenticate via basic authentication header on calling
	 * this method.
	 * 
	 * @apiSuccess user If the authentication details are valid, user details and access token are returned
	 * @apiError 401 Login failed
	 */
	token : function(req, res, next) {
		if (!req.user) {
			return res.json(401, {error: "Login failed"});
		}

		authService.issueToken(req.user).then(function(token) {
			
			var user = {
				user_id: req.user.id,
				user_name: req.user.name,
				email: req.user.email,
				access_token: token
			}			
			var resource = new hal.Resource(user, controller.getRoute(routes.me));
			
			return res.json(resource);

		}).catch(function(e) { 
			return next(e);
		});
	},

	/**
	 * @api {post} /register Register a new account
	 * @apiName Register
	 * @apiGroup Authentication
	 * 
	 * @apiParam {string} email Email address to be used for account login
	 * @apiParam {string} password Account password
	 * @apiParam {string} confirmPassword Repeated password. This must match password
	 * @apiParam {string} name User display name 
	 * 
	 * @apiSuccess user Newly created account
	 * @apiError 400 User model was not valid. See body for error details 
	 */
	register : function(req, res, next) {

		userService.createUser(req.body).then(function(user) {
			var resource = new hal.Resource(user, controller.getRoute(routes.me));
			resource.link('login', controller.getRoute(routes.login));

			return res.json(resource);
		}).catch(ServiceError, function(e) {
			return res.json(400, { error: e.message });
		}).catch(function(e) {
			return next(e);
		})
	},

	/**
	 * @api {get} /me Retrieve current user details
	 * @apiName Me
	 * @apiGroup Authentication
	 */
	me : function(req, res, next) {
		if (!req.user) { 
			return res.json(401, {error: "Unauthorized"})
		}

		var user = {
			user_id: req.user.id,
			user_name: req.user.name,
			email: req.user.email,
		}	
		var resource = new hal.Resource(user, controller.getRoute(routes.me));
		return res.json(resource);
	},
	
	// Return available actions for root directory
	getDirectory : function(user) {		
			
		if (user) {
			return [
				new hal.Link('me', { href: controller.getRoute(routes.me) })
			]
		}
	
		return [
			new hal.Link('login', {href: controller.getRoute(routes.login) }),
			new hal.Link('register', {href: controller.getRoute(routes.register) })
		]
	},
	
	init: function(app, root) {
		controller.root = (root || "") + controllerRoot;
		
		var router = express.Router();
		router.post(routes.login, authenticate.basic, controller.token);
		router.post(routes.register, controller.register);
		router.get(routes.me, authenticate.token, controller.me);
	
		app.use(controllerRoot, router);
		return controller;
	}
}

module.exports = controller;