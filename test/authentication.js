var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	service = rewire('../src/services/authentication');

/*global describe, before, it*/
describe('Authentication', function() {
	
	describe('Account creation', function() {
		
		it('Should let me register an account', function() {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: 'test@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				should.exist(user);
			})
		});
		
		it('Should hash and salt the user password', function() {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: 'test@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				user.password.should.not.equal('secret');
				should.exist(user.salt);
			})			
		})
	
		it('Should reject duplicate email addresses', function() {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve({
						email: 'test@example.com'
					}))
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: 'test@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				throw new Error("Failed")
			}).catch(function(err) {
				err.message.should.match(/email/i);
			})
		});
		
			
		it('Should reject missing email', function() {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: '',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				throw new Error("Failed");
			}).catch(function(err) {
				err.message.should.match(/email/i);
			});	
		});
		
		it('Should reject an invalid email', function() {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: 'a@b@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				throw new Error("Failed");
			}).catch(function(err) {
				err.message.should.match(/email/i);
			});	
		});		
				
		it('Should reject missing password', function() {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: 'test@example.com',
				confirmPassword: 'secret'
			}).then(function(user) {
				throw new Error("Failed");
			}).catch(function(err) {
				err.message.should.match(/password/i);
			});	
		});	
		
		it('Should reject if password and confirmation password do not match', function() {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.register({
				email: 'test@example.com',
				password: 'password',
				confirmPassword: 'secret'
			}).then(function(user) {
				throw new Error("Failed");
			}).catch(function(err) {
				err.message.should.match(/password/i);
			});	
		});	
		
			
	});	
	
	describe('Login', function() {
		
		before(function() {
			var salt = service.generateSalt();
			var password = service.hashPassword('secret', salt);
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve({
						email: 'test@example.com',
						salt: salt,
						password: password
					})),
				}
			
			service.__set__("users", usersMock);			
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
					findOne: sinon.stub().returns(Promise.resolve(null))
				}
			
			service.__set__("users", usersMock);
											
			return service.login('does-not-exist@example.com', 'secret')
			.then(function(user) {
				should.not.exist(user);
			});
		});							
		
	})

});
	