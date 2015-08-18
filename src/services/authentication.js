var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	BearerStrategy = require('passport-http-bearer').Strategy,
	AccessToken = require('../models/accessToken'),
	RefreshToken = require('../models/refreshToken');

service = {
	login : function(username, password) {
		return {

			user: {
				id: 1,
				name: "Test user",
				email: "test@example.com",
			}
		}
	},

	authenticateAccessToken: function(token) {
		if (!token) { return false; }

		var tokenLife = config.get('security.tokenLife');

		if ( Math.round( (Date.now() - token.created) /1000 ) > tokenLife ) {
			return false;
		}

		return true;
	},

	issueBearerToken: function(user) {
		var token = {
			accessToken: new AccessToken({
				userId: user.id
			}),
			refreshToken: new RefreshToken({
				userId: user.id
			}),
			expires_in: config.get('security.tokenLife')
		}

		return  token;
	},

	validateRefreshToken: function(token) {
		return {
			id: 1,
			name: "Test user",
			email: "test@example.com",
		}
	}
};


/* Authentication setup */
passport.use('basic', new BasicStrategy(function(username, password, done) {
	var user = service.login(username, password);
	return done(null, user);
	// Promise.resolve(service.login(username, password))
	// .then(function(result) {
	// 	if (result.err) {
	// 		return done(null, false, result.err);
	// 	}
	// 	return done(null, result.user);
	// })
	// .catch(function(err) {
	// 	return done(err);	
	// })
}));

passport.use(new BearerStrategy(function(accessToken, done) {

	// if (!service.authenticateAccessToken(token)) {
	// 	return done(null, false);
	// }

	var user = service.login('test', 'test')
	return done(null, user, {scope: '*'});
}));

module.exports = service;