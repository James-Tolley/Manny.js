var auth = require('../middleware/authentication'),
	Promise = require('bluebird'),
	hal = require('hal');

function UsersController(routePrefix) {
	
	var self = this;
	
	this.listUsers = function(req, res) {
		var users = userService.all();
		
		res.json(users);
	}
	
	var routes = {
		"list": { rel: "users", href: routePrefix + '/users', auth: auth.token, method: 'get', action: self.listUsers }
	}

}


module.exports = UsersController;