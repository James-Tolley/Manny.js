/*
	OAuth2 Endpoint. Login from external systems and refresh token support.
*/

var oauth2orize = require('oauth2orize'),
	passport = require('passport'),
	ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,	
	authService = require('../services/authentication'),
	Promise = require('bluebird');

var server = oauth2orize.createServer();

// Exchange username & password for access token
server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
	Promise.resolve(authService.login(username, password)).then(function(user) {
		if (!user) {
			return done(null, false) // Username or password incorrect
		}
		
		Promise.resolve(authService.issueBearerToken(user)).then(function(token) {
			return done(null, token.accessToken, token.refreshToken, token.expiresIn);
		});

	}).catch(function(err) {
		return done(err);
	})
}));

// Exchange refresh token for access token
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
	Promise.resolve(authService.validateRefreshToken(refreshToken))
	.then(function(user) {
		if (!user) {
			return done(null, false); // Refresh token expired or invalid
		}

		Promise.resolve(authService.issueBearerToken(user))
		.then(function(token) {
			var info = { scope: '*' };
			return done(null, token.accessToken, token.refreshToken, token.expiresIn);
		})
	}).catch(function(err) {
		return done(err);
	})
}));

passport.use('clientPassword', new ClientPasswordStrategy(function(clientId, clientSecret, done) {
	var user = authService.login('test', 'test');
	return done(null, user);
}))

exports.token = [
	//passport.authenticate(['clientPassword'], { session: false }),
	server.token(),
	server.errorHandler()
];