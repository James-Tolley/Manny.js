var config = require('config'),
	jwt = require('jsonwebtoken'),
	userService = require('./users'),
	Promise = require('bluebird');
	
function checkPassword(user, password) {
	var hash = userService.hashPassword(password, user.salt);
	return hash === user.password;
}

var service = {
	
	/**
	 * Log in a user via email/password combo
	 * @returns A promise which resolves with the authenticated user, or null if either email or password is invalid.
	 */
	login : function(email, password) {
		return userService.findUser(email)
		.then(function(user) {
			if (!user || !checkPassword(user, password)) {
				return null;
			}
			
			return user;
		});
	},
	
	/**
	* Log in user via token.
	* @returns a promise which resolves with the authenticated user, or null if token is invalid.
	*/
	tokenLogin : function(token) {
		return userService.loadUser(token.user_id);
	},

	/**
	 * Generate a json web token (jwt) for a given user.
	 * Token settings are configured in the application config
	 * @see config/default.json
	 * @returns a promise that resolves with the token.
	 */
	issueToken: function(user) {
		var payload = {
			user_id : user.id,
			user_name : user.name,
			email: user.email
		};

		var options = {
			expiresIn: config.get('security.jwt.expiresIn'),
			issuer: config.get('security.jwt.issuer')
		};

		var token = Promise.resolve(jwt.sign(payload, config.get('security.jwt.secretOrKey'), options));
		return token;
	}
};



module.exports = service;