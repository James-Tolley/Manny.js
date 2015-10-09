var hal = require('hal'),
	auth = require('./src/middleware/authentication');

var ApiRoutes = function(app, root) {

	var self = this;
	self.controllers = {
		authentication: require('./src/controllers/authentication').init(app, root), 
		roles: require('./src/controllers/roles').init(app, root), 
		users: require('./src/controllers/users').init(app, root)
	}

	self.getDirectory = function(user) {
		var directory = [];
		for (var name in self.controllers) {
			var controller = self.controllers[name];

			if (controller.getDirectory) {
				var entries = controller.getDirectory(user);
				directory = directory.concat(entries);
			}
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
	
	app.get(root || '/', auth.optional, self.listRoutes);
}

module.exports = function(app, root) {
	return new ApiRoutes(app, root);
}
