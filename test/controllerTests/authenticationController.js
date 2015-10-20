var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	mockResponse = require('./lib/mockResponse'),
	controller = rewire('../../src/controllers/authentication'),
	errors = require('../../src/services/errors');
	
/*global describe, it, before*/
describe('Authentication Controller', function() {

	var next = function(e) {
		console.log(e);
		throw e;
	}
	
	describe('Login', function() {
		
		it('Should return 401 if not logged in', function() {
			var req = {},
				res = mockResponse();
				
			controller.token(req, res, next)
			
			return res.then(function(response) {
				response.status.should.equal(401);
			});
		});
		
		it('Should return an access token if logged in', function() {
			var
				req = {
					user: {id: 1, name: 'test user', email: 'test@example.com'}
				},
				res = mockResponse(),
				authServiceMock = {
					issueToken: function() { return Promise.resolve('token')}
				}
			
			controller.__set__('authService', authServiceMock);
			controller.token(req, res, next);
			
			return res.then(function(response) {
				response.body.should.have.property('access_token');
				response.body.access_token.should.equal('token');
			});		
			
		})
	});
	
	describe('Registering', function() {
		
		it('Should return 400 on a model error', function() {
			var userServiceMock = {
				createUser: function(model) {
					return Promise.reject(new errors.ServiceError('Failure'));
				}
			},
			req = {},
			res = mockResponse();
			
			controller.__set__('userService', userServiceMock);
			controller.register(req, res, next);
			
			return res.then(function(response) {
				response.status.should.equal(400);
			});				
		});
		
		it('Should respond with my user details', function() {
			var userServiceMock = {
				createUser: function(model) {
					return Promise.resolve({id: 1});
				}
			},
			req = {},
			res = mockResponse();
			
			controller.__set__('userService', userServiceMock);
			controller.register(req, res, next);
			
			return res.then(function(response) {
				response.body.should.have.property('id');
			});		
		});
		
		it('Should tell me where to log in', function() {
			var userServiceMock = {
				createUser: function(model) {
					return Promise.resolve({id: 1});
				}
			},
			req = {},
			res = mockResponse();
			
			controller.__set__('userService', userServiceMock);
			controller.register(req, res, next);
			
			return res.then(function(response) {
				response.body._links.should.have.property('login');
			});				
		});
		
	});
	
	describe('Current User', function() {
		 it('Should provide details of the logged in user', function() {
			 var req = {
			 	user: {
				 	id: 1,
					name: 'test',
					email: 'test@example.com'
				}
			 },
			 res = mockResponse();
			 
			 controller.me(req, res, next);
			 return res.then(function(response) {
				 response.body.should.have.property('user_id', 1);
			 });
		 });
		 
		 it('Should return unauthorized if there is no current user', function() {
			 var req = {},
			 res = mockResponse();
			 
			 controller.me(req, res, next);
			 return res.then(function(response) {
				 response.status.should.equal(401);
			 });			 
		 })
	});
	
	describe('Directory', function() {
		
		it('Should return an array of links', function() {
			 var dir = controller.getDirectory();
			 dir.should.be.an.instanceOf(Array);
		});
		
		describe('When logged in', function() {
			it('Should return link to current user', function() {
				
				var dir = controller.getDirectory({id: 1});
				var me = _.find(dir, {'rel': 'me'});
				
				should.exist(me);
			});
		});
		
		describe('When not logged in', function() {
			it('Should return link to log in', function() {
				var dir = controller.getDirectory();
				var login = _.find(dir, {rel: 'login'});
				
				should.exist(login);
			});
			
			it('Should return link to register an account', function() {
				var dir = controller.getDirectory();
				var register = _.find(dir, {rel: 'register'});
				
				should.exist(register);	
			});			
		});
	})
	

	
});
