/**
 * Check app intial configuration and perform it prior to boot
 */

/* global process */
var orm = require('./src/collections/orm'),
	userService = require('./src/services/users'),
	Promise = require('bluebird');

function isConfigured() {
	
	return orm.collections.user.findOne({admin: true, disabled: false})
	.then(function(user) {
			return (!!user);
	})
}

function configureAdmin(adminUser) {
	return userService.createUser(adminUser)
	.then(function(user) {
		return userService.setAdmin(user, true);
	})
}

function configureFromObject(config) {
	console.log("Using configuration file");
	var adminUser = config.admin;
	adminUser.confirmPassword = adminUser.password;
	return configureAdmin(adminUser);
}

function configureFromCommandLine() {
	var read = require('read');
	var adminUser = {};
	
	var question = Promise.promisify(function(options, callback) {
		read(options, callback.bind(null, null));
	})
		
	return question({prompt: 'Admin account email:'})
	.spread(function(err, email, isDefault) {
		adminUser.email = email;
		return question({prompt: 'Admin account password:', silent: true});	
	}).spread(function(err, password, isDefault) {
		adminUser.password = password;
		return question({prompt: 'Confirm password:', silent: true});	
	}).spread(function(err, confirm, isDefault) {
		adminUser.confirmPassword = confirm;
		return configureAdmin(adminUser);
	});	
}

function getInitialConfig() {
	var args = process.argv.slice(2);
	for (var i = 0; i < args.length; i++) {
		if (args[i].match(/^--setup/i)) {
			var file = args[i].split('=')[1];
			
			var config = require(file);
			return config;
		}
	}
	return false;
}

function configure() {
	console.log('Application has not been configured yet. Performing initial setup');	
	var initialConfig = getInitialConfig();
	
	return initialConfig ? configureFromObject(initialConfig) : configureFromCommandLine();
}

module.exports = function() {
	return isConfigured()
	.then(function(configured) {
		return configured || configure();
	});
}