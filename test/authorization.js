var should = require('should'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	service = rewire('../src/services/authorization');
	
/*global describe, it, beforeEach*/
describe('Authorization', function() {
	
	var testUser = {
		id: 1
	};
	
	it('Should authorize if user has the correct permission in the correct scope', function() {
		return service.checkPermission(testUser, "localPermission", "testScope")
		.then(function(granted) {
			granted.should.be.true();
		})	
	});
	
	it('Should authorize if the user has the correct permission at a global scope', function() {
		return service.checkPermission(testUser, "globalPermission", "testScope")
		.then(function(granted) {
			granted.should.be.true();
		});
	});
	
	it('Should not authorize if the user has the correct permission at a different scope', function() {
		return service.checkPermission(testUser, "localPermission", "wrongScope")
		.then(function(granted) {
			granted.should.be.false();
		});
	});
	
	it('Should not authorize if the user does not have the correct permission', function() {
		return service.checkPermission(testUser, "wrongPermission", "testScope")
		.then(function(granted) {
			granted.should.be.false();
		});		
	});
	
	it('Should not authorize if the user has a scoped permission but requires it globally', function() {
		return service.checkPermission(testUser, "localPermission", "")
		.then(function(granted) {
			granted.should.be.false();
		});			
	})
	
});