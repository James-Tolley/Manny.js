var 
	orm = require('../collections/orm'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto'),
	ServiceError = require('./ServiceError');
	

var users = orm.collections.user;

/**
 * User management
 */	
var service = {
	
	users: function() {
		return users.find();
	},	
	
	findUser: function(email) {
		return users.findOne({email: email});
	},
	
	loadUser: function(id) {
		return users.findOne({id: id});
	},
	
	generateSalt: function() {
		return crypto.randomBytes(16).toString('hex');	
	},

	hashPassword: function(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 4096, 256).toString('hex');	
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
	 * Create a new user.
	 * @returns a promise which resolves with the newly created user
	 * @throws an Error with relevant message if the model does not pass validation
	 */
	createUser: function(model) {

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
	 * Sets a user as system admin
	 */
	setAdmin: function(user, isAdmin) {
		return users.update({id: user.id}, {isAdmin: isAdmin});
	},		
	
}

module.exports = service;