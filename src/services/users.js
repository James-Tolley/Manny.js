var 
	orm = require('../collections/orm'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto'),
	roleService = require('./roles'),
	ServiceError = require('./ServiceError');
	

var users = orm.collections.user;

/**
 * User management
 */	
var service = {
	
	/**
	 * Get all users
	 */
	users: function() {
		return users.find();
	},	
	
	/**
	 * Find a user by email address
	 * 
	 * @returns Found user, or null if user does not exist
	 */
	findUser: function(email) {
		return users.findOne({email: email});
	},
	
	/**
	 * Load a user by id.
	 * 
	 * @returns Found user, or null if user does not exist
	 */
	loadUser: function(id) {
		return users.findOne({id: id});
	},
	
	/**
	 * Generate a crytographically secure random salt
	 * 
	 * @returns {string} salt encoded as hexadecimal
	 */
	generateSalt: function() {
		return crypto.randomBytes(16).toString('hex');	
	},

	/**
	 * Hash a password using a slow hashing function and a salt.
	 * 
	 * @returns {string} hashed password encoded as hexadecimal
	 */
	hashPassword: function(password, salt) {
		return crypto.pbkdf2Sync(password, salt, 4096, 256).toString('hex');	
	},
	
	/**
	 * Validate an email address
	 * 
	 * @return true if email is valid, false otherwise
	 */
	validEmail: function(email) {
		//http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
		var regex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
		return regex.test(email);	
	},
	
	/**
	 * Validate a password
	 * 
	 * @returns {string} Empty string if password is valid, otherwise an error message
	 */
	checkPassword: function(password) {
		//Don't allow colons as they can't be used in basic auth headers
		if (password.indexOf(':') > 0) {
			return "Password cannot contain a ':'";
		}
	},
		
	/**
	 * Validates a new user model
	 * 
	 * @returns Promise which succeeds with no value if model is valid and rejects with a relevant error if it is not
	 * @throws {ServiceError} Model does not pass validation
	 */
	validateNewUserModel: function(model) {

		if (!model.email) { return Promise.reject(new ServiceError("Email address is required")); }
		if (!service.validEmail(model.email)) { return Promise.reject(new ServiceError("Email address is not valid")); }
		if (!model.password) { return Promise.reject( new ServiceError("Password is required")); }
		
		var passwordError = service.checkPassword(model.password);
		if (passwordError) { return Promise.reject(new ServiceError(passwordError)); }
		
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
	 * @throws {ServiceError} Model does not pass validation
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
	
	/**
	 * Assign a role to a user. 
	 * @param {number} userId User to assign role to
	 * @param {string} roleName name of role to assign
	 * @param {string} scope if set, limit role to this scope. 
	 * 
	 * @throws {ServiceError} User does not exist
	 * @throws {ServiceError} Role does not exist
	 * 
	 * @returns User and updated roles
	 */
	assignRoleToUser: function(userId, roleName, scope) {
		
		var userLoad = service.loadUser(userId).populate('roles');
		var roleLoad = roleService.findRole(roleName);
		
		return Promise.all([userLoad, roleLoad])
		.spread(function(user, role) {
			if (!user) { throw new ServiceError("User does not exist"); }
			if (!role) { throw new ServiceError("Role does not exist"); }
			
			var existing = _.find(user.roles, function(userRole) {
				userRole.role === role.id;
			});
			
			if (!existing || existing.scope != scope) {
				user.roles.push({
					user: user,
					role: role,
					scope: scope
				})
				return user.save();
			} else {
				return Promise.resolve(user);
			}
		});
	},
	
	/**
	 * Remove a role from a user.
	 * 
	 * @param {number} userId User to assign role to
	 * @param {string} roleName name of role to remove
	 * @param {string} scope Scope to remove the role from.	
	 *  
	 * @throws {ServiceError} User does not exist
	 * @throws {ServiceError} Role does not exist
	 * @throws {ServiceError} User does not have role at the specified scope
	 * 
	 * @returns User and updated roles
	 */	
	removeRoleFromUser: function(userId, roleName, scope) {
		
		var userLoad = service.loadUser(userId).populate('roles');
		var roleLoad = roleService.findRole(roleName);
				
		return Promise.all([userLoad, roleLoad])
		.spread(function(user, role) {
			if (!user) { throw new ServiceError("User does not exist"); }
			if (!role) { throw new ServiceError("Role does not exist"); }
						
			var removed = _.remove(user.roles, function(userRole) {
				return userRole.role === role.id 
					&& (userRole.scope || "") == (scope || "");
			});
			
			if (removed.length <= 0) {
				var error = "User does not have role " + roleName;
				if (scope) {
					error = error + " at scope " + scope;
				}
				throw new ServiceError(error);
			}	
					
			return user.save();
		});
	}
	
}

module.exports = service;