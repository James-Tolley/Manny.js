var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	mockResponse = require('./lib/mockResponse'),
	controller = rewire('../../src/controllers/authentication'),
	ServiceError = require('../../src/services/ServiceError');
	
/*global describe, it, before*/
describe('AuthenticationController', function() {

	var next = function(e) {
		console.log(e);
		throw e;
	}
	
	describe('Access Token', function() {
		
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
		
		it('Should return BadRequest on an error', function() {
			var userServiceMock = {
				createUser: function(model) {
					return Promise.reject(new ServiceError('Failure'));
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
	
});
