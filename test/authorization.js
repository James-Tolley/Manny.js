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
	
	beforeEach(function() {
		
		var fakePermissions = [
			{id: 1, name: "Permission 1"},
			{id: 2, name: "Permission 2"},
			{id: 3, name: "Permission 3"},
			{id: 4, name: "Permission 4"}
		]
		var fakeRoles = [
			{
				user: 1,
				role: {
					id: 1,
					name: "Role 1"			
				}
			},
			{
				user: 1,
				role: {
					id: 1,
					name: "Role 1"
				},
				scope: "scope1"
			},
			{
				user: 1,
				role: {
					id: 2,
					name: "Role 2"
				},
				scope: "scope1"
			}
		]
		
		var userServiceMock = {
			getRolesForUser: function() { return Promise.resolve(fakeRoles); }
		}
		
		service.__set__('userService', userServiceMock);
		
	});
	
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