var oauth2orize = require('oauth2orize'),
	passport = require('passport'),
	authenticationService = require('./authentication'),
	Promise = require('bluebird');

var server = oauth2orize.createServer();

// Exchange username & password for access token
server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, done) {
	authenticationService.login(username, password).then(function(user) {
		if (!user) {
			return done(null, false) // Username or password incorrect
		}

		Promise.resolve(issuerBearerToken(user))
		.then(function(token) {
			return done(null, token.accessToken, token.refreshToken, token.expiresIn);
		});


	}).catch(function(err) {
		return done(err);
	})
}));

// Exchange refresh token for access token
server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, done) {
	Promise.resolve(validateRefreshToken(refreshToken))
	.then(function(user) {
		if (!user) {
			return done(null, false); // Refresh token expired or invalid
		}

		Promise.resolve(issuerBearerToken(user))
		.then(function(token) {
			var info = { scope: '*' };
			return done(null, token.accessToken, token.refreshToken, token.expiresIn);
		})
	}).catch(function(err) {
		return done(err);
	})
}));

function issueBearerToken(user) {
	var token = {
		accessToken: new AccessToken({
			userId: user.id
		}),
		refreshToken: new RefreshToken({
			userId: user.id
		}),
		expires_in: config.get('security.tokenLife')
	}
}

function validateRefreshToken (token) {
	return {
		id: 1,
		name: "Test user",
		email: "test@example.com",
	}
}

exports.token = [
	passport.authenticate(['basic', 'clientPassword'], { session: false }),
	server.token(),
	server.errorHandler()
];