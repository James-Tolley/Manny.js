var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	jwt = require('jsonwebtoken');

service = {
	login : function(username, password) {
		var user = {
			id: 1,
			name: "Test user",
			email: "test@example.com",
		};

		return user;
	},

	tokenLogin : function(token) {
		var user = {
			id: 1,
			name: "Test user",
			email: "test@example.com",
		
		};
		return user;
	},

	issueToken: function(user) {
		var payload = {
			user_id : user.id,
			user_name : user.name,
			email: user.email
		};

		var options = {
			expiresInSeconds: config.get('security.jwt.expiresInSeconds'),
			issuer: config.get('security.jwt.issuer')
		};

		var token = jwt.sign(payload, config.get('security.jwt.secretOrKey'), options);
		return token;
	},

	basicAuth: passport.authenticate('basic', { session: false}),
	tokenAuth: passport.authenticate('jwt', {session: false}),

	/*
	 	Allow the request regardless, but set the correct user if authorized
	*/
	optionalAuth: function(req, res, next) {
		passport.authenticate('jwt', function(err, user, info) {
			req.user = user;
			next();
		})(req, res, next);
	}
};

/* Authentication setup */
passport.use('basic', new BasicStrategy(function(username, password, done) {
	var user = service.login(username, password);
	return done(null, user);
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