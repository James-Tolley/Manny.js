var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	service = rewire('../src/services/authentication');

describe('Authentication', function() {
	
	describe('Account creation', function() {
		
		it('Should let me register an account', function(done) {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			service.register({
				email: 'test@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				should.exist(user);
				done();
			})
		});
		
		it('Should hash and salt the user password', function(done) {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			service.register({
				email: 'test@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				user.password.should.not.equal('secret');
				should.exist(user.salt);
				done();
			})			
		})
	
		it('Should reject duplicate email addresses', function(done) {
			var 
				usersMock = {
					findOne: sinon.stub().returns(Promise.resolve({
						email: 'test@example.com'
					}))
				}
			
			service.__set__("users", usersMock);
			
			service.register({
				email: 'test@example.com',
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				should.not.exist(user);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/email/i);
				done();
			});	
		});
		
			
		it('Should reject missing email', function(done) {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			service.register({
				password: 'secret',
				confirmPassword: 'secret'
			}).then(function(user) {
				should.not.exist(user);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/email/i);
				done();
			});	
		});
		
		it('Should reject missing password', function(done) {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			service.register({
				email: 'test@example.com',
				confirmPassword: 'secret'
			}).then(function(user) {
				should.not.exist(user);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/password/i);
				done();
			});	
		});	
		
		it('Should reject if password and confirmation password do not match', function(done) {
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null)),
					create: sinon.stub().returnsArg(0)
				}
			
			service.__set__("users", usersMock);
			
			service.register({
				email: 'test@example.com',
				password: 'password',
				confirmPassword: 'secret'
			}).then(function(user) {
				should.not.exist(user);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/password/i);
				done();
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
		
		it('Should accept valid credentials', function(done) {
			
			service.login('test@example.com', 'secret')
			.then(function(user) {
				user.email.should.match('test@example.com');
				done();
			}).catch(function(err) {
				console.log(err);
				should.not.exist(err);
				done();
			})
		});		
		
		it('Should reject invalid password', function(done) {
								
			service.login('test@example.com', 'wrong-password')
			.then(function(user) {
				should.not.exist(user);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/invalid login/i)
				done();
			})
		});
		
		it('Should reject invalid email address', function(done) {
						
			var usersMock = {
					findOne: sinon.stub().returns(Promise.resolve(null))
				}
			
			service.__set__("users", usersMock);
											
			service.login('does-not-exist@example.com', 'secret')
			.then(function(user) {
				should.not.exist(user);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/invalid login/i)
				done();
			})
		});							
		
	})

});
	