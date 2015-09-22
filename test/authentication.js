var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	service = rewire('../src/services/authentication');

/*global describe, before, it*/
describe('Authentication', function() {

	
	describe('Login', function() {
		
		var userService = require('../src/services/users')
		
		before(function() {
			var salt = userService.generateSalt();
			var password = userService.hashPassword('secret', salt);
			var usersMock = {
					findUser: sinon.stub().returns(Promise.resolve({
						email: 'test@example.com',
						salt: salt,
						password: password
					})),
					hashPassword: userService.hashPassword
				}
			
			service.__set__("userService", usersMock);			
		});
		
		it('Should accept valid credentials', function() {
			
			return service.login('test@example.com', 'secret')
			.then(function(user) {
				user.email.should.match('test@example.com');
			});
		});		
		
		it('Should reject invalid password', function() {
								
			return service.login('test@example.com', 'wrong-password')
			.then(function(user) {
				should.not.exist(user);
			});
		});
		
		it('Should reject invalid email address', function() {
						
			var usersMock = {
					findUser: sinon.stub().returns(Promise.resolve(null))
				}
			
			service.__set__("userService", usersMock);
											
			return service.login('does-not-exist@example.com', 'secret')
			.then(function(user) {
				should.not.exist(user);
			});
		});							
		
	})

});
	