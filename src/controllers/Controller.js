var passport = require('passport');

var Controller = function(routes) {
	this.routes = routes;
}

/* Setup routes on the application */
Controller.prototype.initializeRoutes = function(app) {
	
	var routes = this.routes;

	function initializeRoute(routeName, route) 
	{
		var method = route.method || 'get';
		var auth = route.auth;

		if (auth) {
			app[method](route.href, route.auth, route.action);	
		} else {
			app[method](route.href, route.action);
		}
	}

	for (var route in routes) {
		if (routes.hasOwnProperty(route)) {
			initializeRoute(route, routes[route]);
		}
	}
}

module.exports = Controller;