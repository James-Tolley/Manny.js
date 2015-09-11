/**
 * Check app intial configuration and perform it prior to boot
 */

var orm = require('./src/collections/orm'),
	authService = require('./src/services/authentication'),
	Promise = require('bluebird'),
	pkg = require('./package.json');

function isConfigured() {
	
	return orm.collections.user.findOne({admin: true, disabled: false})
	.then(function(user) {
			return (!!user);
	})
}

function configureAdmin(rl) {
	
	var question = Promise.promisify(function(question, callback) {
		rl.question(question, callback.bind(null, null));
	})
	
	var adminUser = {};
	return question('Admin account email:').then(function(email) {
		adminUser.email = email
		return question('Admin account password:');
	}).then(function(password) {
		adminUser.password = password;
		return question('Confirm password:')
	}).then(function(confirm) {
		adminUser.confirmPassword = confirm;
		return authService.register(adminUser);
	}).then(function(user) {
		return authService.setAdmin(user, true);
	});	
		
}

function configure() {
	console.log(pkg.name + ' has not been configured yet. Performing initial setup');	
	
	var readline = require('readline');
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	
	return configureAdmin(rl)
	.finally(function() {
		rl.close();
	})
}

module.exports = function() {
	
	return isConfigured()
	.then(function(configured) {
		return configured || configure();
	});
}