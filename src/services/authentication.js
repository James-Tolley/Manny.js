var config = require('config'),
	passport = require('passport'),
	Promise = require('bluebird'),
	BasicStrategy = require('passport-http').BasicStrategy,
	JwtStrategy = require('passport-jwt').Strategy,
	jwt = require('jsonwebtoken'),
	crypto = require('crypto'),
	userService = require('./users');
	
function generateSalt() {
	return crypto.randomBytes(16).toString('hex');	
}

function hashPassword(password, salt) {
	return crypto.pbkdf2Sync(password, salt, 4096, 256).toString('hex');	
};

function checkPassword(user, password) {
	var hash = hashPassword(password, user.salt);
	return hash === user.password;
}

var service = {
	
	validateNewUserModel: function(model) {

		return userService.find(model.email)
		.then(function(user) {
			if (user) { throw new Error("Email address is already in use");	}
			if (!model.password) { throw new Error("Password is required"); }
			if (!model.confirmPassword) { throw new Error("Password confirmation is required"); }

			if (model.password !== model.confirmPassword) { throw new Error("Passwords do not match"); } 
		});

	},

	register: function(model) {

		return service.validateNewUserModel(model)
		.then(function() {
			var salt = generateSalt();
			var user = {
				email : model.email,
				name : model.name,
				salt : salt,
				password: hashPassword(model.password, salt)
			}
			return userService.create(user)
		});
	},

	login : function(email, password) {
		
		return userService.find(email)
		.then(function(user) {
			if (!user || !checkPassword(user, password)) {
				throw new Error("Invalid Login");
			}
			
			return user;
		});
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