var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	jwt = require('jsonwebtoken'),
	crypto = require('crypto'),
	orm = require('../collections/orm');
	
var service = {
	
	users: orm.collections.user,

	validateNewUserModel: function(model) {

		return service.findUser(model.email)
		.then(function(user) {
			if (user) { throw new Error("Email address is already in use");	}
			if (!model.password) { throw new Error("Password is required"); }
			if (!model.confirmPassword) { throw new Error("Password confirmation is required"); }

			if (model.password !== model.confirmPassword) { throw new Error("Passwords do not match"); } 
		});

	},

	register: function(newUserModel) {

		return service.validateNewUserModel(newUserModel)
		.then(function() {

			return service.users.create({
				name: newUserModel.name,
				email: newUserModel.email,
				salt: crypto.randomBytes(16).toString('hex'),
			})

		}).then(function(newUser) {
			newUser.password = newUser.hashPassword(newUserModel.password);
			return newUser.save();
		});
	},

	findUser : function(email) {
		return service.users.findOne().where({email: email});
	},

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