var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	mockResponse = require('./lib/mockResponse'),
	controller = rewire('../../src/controllers/roles'),
	ServiceError = require('../../src/services/ServiceError');

/*global describe, it*/	
describe('Role Management', function() {
	
	var next = function(e) {
		console.log(e);
		throw e;
	}
	
	describe('Directory', function() {
		
		
		describe('With permission', function() {
			it('Should list the role management root', function() {
				
				var mockAuthService = {
					checkPermission: function() { return Promise.resolve(true); }
				}
				controller.__set__('authorizationService', mockAuthService);
				
				return controller.getDirectory({})
				.then(function(dir) {
					var roles = _.find(dir, {rel: 'roles'});
					should.exist(roles);
				});			
			})			
		});
		
		describe('Without permission', function() {
			it('Should not return any entries', function() {
				
				var mockAuthService = {
					checkPermission: function() { return Promise.resolve(false); }
				}
				
				controller.__set__('authorizationService', mockAuthService);
				return controller.getDirectory({})
				.then(function(dir) {
					dir.length.should.equal(0);	
				});
											
			})				
		})
	})

	
});
