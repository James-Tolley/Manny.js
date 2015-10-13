var _ = require('lodash');

/**
 * Replaces parameters in a url with values specified in an object
 * 
 * e.g.
 * 
 * /resource/:id/children/:optionalid?
 * {
 *     id: 1,
 *     optionalid: 2
 * }
 * => /resource/1/children/2
 * 
 * Optional properties are cleared if not specified
 * 
 * {
 * 		id: 1
 * }
 * => /resource/1/children/
 * 
 * If a primitive is passed into params, it replaces the id parameter with that value
 * 
 * todo: This could be cooler. But I don't need it to be.
 */
function getRoute(url, params) {
	
	function escapeRegExp(value) {
		return value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	}
	
	function replaceParam(param, value) {
		value = value || "";
		
		var regex = RegExp('(:' + escapeRegExp(param) + '\\??)(\/|$)', 'i');
		return url.replace(regex, value + "$2");
	}
		
	if (params && !_.isObject(params)) {
		url = replaceParam('id', params);
	}
	else {
		for (var param in params) {
			if (params.hasOwnProperty(param)) {
				var value = params[param];
				
				url = replaceParam(param, value);			
			}
		}
	}
	
	// clear remaining optional parameterss
	url = url.replace(/:[a-z,0-9]+\?/i, '');
	
	return url;	
}

function Controller(controllerRoot) {
	
	var self = this;
	self.root = controllerRoot;
}

Controller.prototype.getRoute = function(route, routeParams) {
	var url = (this.root || "") + route;
	
	if (routeParams) {
		url = getRoute(url, routeParams);
	}
	return url;	
}

module.exports = Controller;