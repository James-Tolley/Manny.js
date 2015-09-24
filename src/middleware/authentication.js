/**
 * Express 4 Authentication Middleware
 */

var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	authenticationService = require('../services/authentication')

/**
 * Basic Authentication
 */
exports.basic = passport.authenticate('basic', { session: false});

/**
 * JSON Web Token Authentication
 */
exports.token = passport.authenticate('jwt', {session: false});

/**
 * Optional authentication. Allow the request but set the user if authenticated.
 */
exports.optional = function(req, res, next) {
	passport.authenticate('jwt', function(err, user, info) {
		req.user = user;
		next();
	})(req, res, next);
}

/* Authentication setup */
passport.use('basic', new BasicStrategy(function(username, password, done) {
	authenticationService.login(username, password).then(function(user) {
		return done(null, user);	
	}).catch(function(e) {
		return done(e, false);
	});
}));

var jwtOptions = config.get('security.jwt');
passport.use('jwt', new JwtStrategy(jwtOptions, function(jwt, done) {
	authenticationService.tokenLogin(jwt).then(function(user) {
		return done(null, user || false);
	}).catch(function(err) {
		return done(err, false);
	})
}));