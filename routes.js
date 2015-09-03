var hal = require('hal'),
	passport = require('passport'),
	authService = require('./src/services/authentication');

var AuthenticationController = require('./src/controllers/authentication').Controller;

var authenticateToken = passport.authenticate('jwt', {session: false});

var RouteDirectory = function() {

	var self = this,
		controllers = {};

	this.initializeControllers = function(app, routePrefix) {

		function initializeController(Controller) {
			var ctlr = new Controller(routePrefix);
			ctlr.initializeRoutes(app);

			return ctlr;
		}

		var controllers = {
			"authentication": initializeController(AuthenticationController)
		};

		self.controllers = controllers;
		return self.controllers;
	},

	this.getDirectory = function(user) {
		var directory = [];
		for (var name in self.controllers) {
			var controller = self.controllers[name];

			var entries = controller.getDirectory(user);
			directory = directory.concat(entries);
		}

		return directory;
	},


	this.listRoutes = function(req, res) {

		var resource = new hal.Resource({}, req.url);

		var directory = self.getDirectory(req.user);
		for (var i = 0; i < directory.length; i++) {
			var entry = directory[i];
			var options = {
				href: entry.href
			};
			
			if (entry.templated) { 
				options.templated = entry.templated; 
			}

			var link = new hal.Link(entry.rel, options);

			resource.link(link);
		}		

		return res.json(resource);
	}
}

var routeDirectory = new RouteDirectory();

module.exports = function(app, routePrefix) {

	app.controllers = routeDirectory.initializeControllers(app, routePrefix);

	app.get(routePrefix || "/", authService.optionalAuth, routeDirectory.listRoutes);
}