var hal = require('hal'),
	auth = require('./src/middleware/authentication'),
	Promise = require('bluebird');

var ApiRoutes = function(app, root) {

	var self = this;
	self.controllers = {
		authentication: require('./src/controllers/authentication').init(app, root), 
		roles: require('./src/controllers/roles').init(app, root), 
		users: require('./src/controllers/users').init(app, root)
	}

	self.getDirectory = function(user) {
		var directoryPromises = [];
		for (var name in self.controllers) {
			var controller = self.controllers[name];			
			directoryPromises.push(controller.getDirectory(user));
		}
		
		return Promise.all(directoryPromises)
		.then(function(entryArray) {

			var directory = [].concat.apply([], entryArray);
			return directory;			
			
		});
	},


	self.listRoutes = function(req, res) {

		self.getDirectory(req.user)
		.then(function(directory) {
			var resource = new hal.Resource({}, req.url);
			for (var i = 0; i < directory.length; i++) {
				var link = directory[i];
	
				resource.link(link);
			}				
			return res.json(resource);
		});
	}
	
	app.get(root || '/', auth.optional, self.listRoutes);
}

module.exports = function(app, root) {
	return new ApiRoutes(app, root);
}
