var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	controller = rewire('../../src/controllers/authentication');
	
/*global describe, it, before*/
describe('AuthenticationController', function() {

	var res = {
		json: function(errOrObj, obj) {
			if (obj) {
				return { 
					status: errOrObj,
					body: obj
				}
			}
			return {
				status: 200,
				body: errOrObj
			}
		}
	}
	var next = function(e) {
		console.log(e);
		throw e;
	}
	
	describe('Access Token', function() {
		
		it('Should return 401 if not logged in', function() {
			var req = {};
			return controller.token(req, res, next)
			.then(function(res) {
				res.status.should.equal(401);
			})
		});
		
		// 
		// it('Should return an access token if logged in', function() {
		// 	var
		//      req = {
		// 		 user: {id: 1, name: 'test user', email: 'test@example.com'}
		// 	 },
		// 	 authServiceMock = {
		// 		issueToken: function() { return Promise.resolve('token')}
		// 	}
		// 	
		// 	controller.__set__('authService', authServiceMock);
		// 	return controller.token(req, res, next)
		// 	.then(function(res) {
		// 		res.body.should.have.property('access_token');
		// 		res.body.access_token.should.equal('token');
		// 	});		
		// 	
		// })
	})
	
});
