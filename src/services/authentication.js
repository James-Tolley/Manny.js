var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	jwt = require('jsonwebtoken'),
	crypto = require('crypto'),
	orm = require('../collections/orm');
	


var users = orm.collections.user;

var service = {
	
	generateSalt: function() {
		return crypto.randomBytes(16).toString('hex');	
	},

	hashPassword: function(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 4096, 256).toString('hex');	
	},

	checkPassword: function(user, password) {
		var hash = service.hashPassword(password, user.salt);
		return hash === user.password;
	},
		
	validateNewUserModel: function(model) {

		if (!model.email) { return Promise.reject(new Error("Email address is required")); }
		if (!model.password) { return Promise.reject(new Error("Password is required")); }
		if (!model.confirmPassword) { return Promise.reject(new Error("Password confirmation is required")); }
		if (model.password !== model.confirmPassword) { return Promise.reject(new Error("Passwords do not match")); }
		 		
		return users.findOne({email: model.email})
		.then(function(user) {
			if (user) { throw new Error("Email address is already in use");	}
		});

	},

	register: function(model) {

		return service.validateNewUserModel(model)
		.then(function() {
			var salt = service.generateSalt();
			var user = {
				email : model.email,
				name : model.name,
				salt : salt,
				password: service.hashPassword(model.password, salt)
			}
			return users.create(user)
		});
	},

	login : function(email, password) {
		
		return users.findOne({email: email})
		.then(function(user) {
			if (!user || !service.checkPassword(user, password)) {
				throw new Error("Invalid Login");
			}
			
			return user;
		});
	},

	tokenLogin : function(token) {
		return users.findOne({id: token.user_id});
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

	/* Authentication methods */
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