var hal = require('hal'),
	authService = require('./src/services/authentication');

var AuthenticationController = require('./src/controllers/authentication').Controller,
	RolesController = require('./src/controllers/roles').Controller;

var ApiRoutes = function(app, root) {

	var self = this;
	self.controllers = {
		authentication: new AuthenticationController(app, root),
		roles: new RolesController(app, root)
	}

	self.getDirectory = function(user) {
		var directory = [];
		for (var name in self.controllers) {
			var controller = self.controllers[name];

			var entries = controller.getDirectory(user);
			directory = directory.concat(entries);
		}

		return directory;
	},


	self.listRoutes = function(req, res) {

		var resource = new hal.Resource({}, req.url);

		var directory = self.getDirectory(req.user);
		for (var i = 0; i < directory.length; i++) {
			var link = directory[i];

			resource.link(link);
		}		

		return res.json(resource);
	}
	
	app.get(root || '/', authService.optionalAuth, self.listRoutes);
}

module.exports = function(app, root) {
	return new ApiRoutes(app, root);
}
