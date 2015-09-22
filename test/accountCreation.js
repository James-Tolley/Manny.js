var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	service = rewire('../src/services/users');
	
/*global describe, before, it*/
describe('Account creation', function() {
		
		it('Can create a user', function() {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			return service.createUser({
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
			
			return service.createUser({
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
			
			return service.createUser({
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
			
			return service.createUser({
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
			
			return service.createUser({
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
			
			return service.createUser({
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
			
			return service.createUser({
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