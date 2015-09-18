var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	jwt = require('jsonwebtoken'),
	crypto = require('crypto'),
	orm = require('../collections/orm'),
	ServiceError = require('./ServiceError');

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
	
	validEmail: function(email) {
		//http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
		var regex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
		return regex.test(email);	
	},
		
	validateNewUserModel: function(model) {

		if (!model.email) { return Promise.reject(new ServiceError("Email address is required")); }
		if (!service.validEmail(model.email)) { return Promise.reject(new ServiceError("Email address is not valid")); }
		if (!model.password) { return Promise.reject(new ServiceError("Password is required")); }
		if (!model.confirmPassword) { return Promise.reject(new ServiceError("Password confirmation is required")); }
		if (model.password !== model.confirmPassword) { return Promise.reject(new ServiceError("Passwords do not match")); }
		 		
		return users.findOne({email: model.email})
		.then(function(user) {
			if (user) { throw new ServiceError("Email address is already in use");	}
		});

	},

	/**
	 * Register a new user.
	 * @returns a promise which resolves with the newly created user
	 * @throws an Error with relevant message if the model does not pass validation
	 */
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

	/**
	 * Log in a user via email/password combo
	 * @returns A promise which resolves with the authenticated user, or null if either email or password is invalid.
	 */
	login : function(email, password) {
		
		return users.findOne({email: email})
		.then(function(user) {
			if (!user || !service.checkPassword(user, password)) {
				return null;
			}
			
			return user;
		});
	},
	
	/**
	 * Sets a user as system admin
	 * todo: Move this out of authentication
	 */
	setAdmin: function(user, isAdmin) {
		return users.update({id: user.id}, {isAdmin: isAdmin});
	},
	
	/**
	* Log in user via token.
	* @returns a promise which resolves with the authenticated user, or null if token is invalid.
	*/
	tokenLogin : function(token) {
		return users.findOne({id: token.user_id});
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