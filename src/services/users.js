var 
	orm = require('../collections/orm'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	crypto = require('crypto'),
	config = require('config'),
	errors = require('./errors');
	

var users = orm.collections.user,
	userRoles = orm.collections.userrole,
	roles = orm.collections.role;

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
	checkEmail: function(email) {
		if (!email) { return "Email address is required" }
		
		//http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
		var regex = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
		
		if (!regex.test(email)) { return "Email address is not valid" };	
	},
	
	/**
	 * Validate a password
	 * 
	 * @returns {string} Empty string if password is valid, otherwise an error message
	 */
	checkPassword: function(password) {
		var maxPasswordLength = 512, // Sanity check to avoid hashing DOS.
			minPasswordLength = 1,
			minPasswordLengthKey = 'security.password.minLength'; 
		
		if (config.has(minPasswordLengthKey)) {
			// Stop silly things like 0 or negative lengths
			minPasswordLength = Math.max(minPasswordLength, config.get(minPasswordLengthKey));
		}
		
		if (!password) { return "Password is required" }
		if (password.length > maxPasswordLength) { return "Password must be less than " + maxPasswordLength + " characters"}
		if (password.length < minPasswordLength) { return "Password must be at least " + minPasswordLength + " characters"}
		
		return "";
	},
		
	/**
	 * Validates a new user model
	 * 
	 * @returns Promise which succeeds with no value if model is valid and rejects with a relevant error if it is not
	 * @throws {ServiceError} Model does not pass validation
	 */
	validateNewUserModel: function(model) {

		var emailError = service.checkEmail(model.email);
		if (emailError) { return Promise.reject(new errors.ServiceError(emailError)); }

		var passwordError = service.checkPassword(model.password);
		if (passwordError) { return Promise.reject(new errors.ServiceError(passwordError)); }
		
		if (!model.confirmPassword) { return Promise.reject(new errors.ServiceError("Password confirmation is required")); }
		if (model.password !== model.confirmPassword) { return Promise.reject(new errors.ServiceError("Passwords do not match")); }
		
		 		
		return users.findOne({email: model.email})
		.then(function(user) {
			if (user) { throw new errors.ServiceError("Email address is already in use");	}
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
	 * Get all roles for a user
	 */
	getRolesForUser: function(userId) {
		return userRoles.find({user: userId}).populate('role');
	},
	
	/**
	 * Assign a role to a user. 
	 * @param {number} userId Id User to assign role to
	 * @param {number} roleId Id of role to assign
	 * @param {string} scope if set, limit role to this scope. 
	 * 
	 * @throws {NotFoundError} User does not exist
	 * @throws {NotFoundError} Role does not exist
	 * @throws {ServiceError} Attempt to assign global role at scope.
	 * 
	 * @returns User and updated roles
	 */
	assignRoleToUser: function(userId, roleId, scope) {
		
		var userLoad = users.findOne(userId).populate('roles');
		var roleLoad = roles.findOne(roleId).populate('permissions');
		
		return Promise.all([userLoad, roleLoad])
		.spread(function(user, role) {
			if (!user) { throw new errors.NotFoundError("User does not exist"); }
			if (!role) { throw new errors.NotFoundError("Role does not exist"); }
			
			
			var globalRole = _.find(role.permissions, {isGlobal: true});
			if (globalRole && scope) {
				throw new errors.ServiceError("Role contains global permissions and cannot be assigned with limited scope");
			}
			
			var existing = _.find(user.roles, function(userRole) {
				userRole.role === role.id;
			});
			
			if (!existing || existing.scope != scope) {
				user.roles.add({
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
	 * @param {number} userId Id of user to assign role to
	 * @param {number} roleId Id of role to remove
	 * @param {string} scope Scope to remove the role from.	
	 *  
	 * @throws {ServiceError} User does not exist
	 * @throws {ServiceError} Role does not exist
	 * @throws {ServiceError} User does not have role at the specified scope
	 * 
	 * @returns User and updated roles
	 */	
	removeRoleFromUser: function(userId, roleId, scope) {
		
		var userLoad = users.findOne({id: userId}).populate('roles');
		var roleLoad = roles.findOne(roleId);
				
		return Promise.all([userLoad, roleLoad])
		.spread(function(user, role) {
			if (!user) { throw new errors.NotFoundError("User does not exist"); }
			if (!role) { throw new errors.NotFoundError("Role does not exist"); }
			
			var removed = _.remove(user.roles, function(userRole) {
				return userRole.role === role.id 
					&& (userRole.scope || "") == (scope || "");
			});
			
			if (removed.length <= 0) {
				var error = "User does not have role " + role.name;
				if (scope) {
					error = error + " at scope " + scope;
				}
				throw new errors.ServiceError(error);
			}	
					
			return user.save();
		});
	}
	
}

module.exports = service;