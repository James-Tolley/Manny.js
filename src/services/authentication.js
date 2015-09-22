var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	jwt = require('jsonwebtoken'),
	userService = require('./users'),
	ServiceError = require('./ServiceError');

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
	 * @returns the token.
	 */
	issueToken: function(user) {
		var payload = {
			user_id : user.id,
			user_name : user.name,
			email: user.email
		};

		// todo: does config handly these not existing? Set defaults
		var options = {
			expiresInSeconds: config.get('security.jwt.expiresInSeconds'),
			issuer: config.get('security.jwt.issuer')
		};

		var token = jwt.sign(payload, config.get('security.jwt.secretOrKey'), options);
		return token;
	},

	/* Authentication method hooks for controllers to use instead of referencing passport directly */
	basicAuth: passport.authenticate('basic', { session: false}),
	tokenAuth: passport.authenticate('jwt', {session: false}),
	optionalAuth: function(req, res, next) {
	 	//Allow the request regardless, but set the correct user if authorized
		passport.authenticate('jwt', function(err, user, info) {
			req.user = user;
			next();
		})(req, res, next);
	}
};

/* Authentication setup */
passport.use('basic', new BasicStrategy(function(username, password, done) {
	service.login(username, password).then(function(user) {
		return done(null, user);	
	}).catch(function(e) {
		return done(e, false);
	});
}));

var jwtOptions = config.get('security.jwt');
passport.use('jwt', new JwtStrategy(jwtOptions, function(jwt, done) {
	Promise.resolve(service.tokenLogin(jwt)).then(function(user) {
		return done(null, user || false);
	}).catch(function(err) {
		return done(err, false);
	})
}));


module.exports = service;