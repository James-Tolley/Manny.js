var should = require('should'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	service = rewire('../../src/services/authorization');
	
/*global describe, it, before*/
describe('Authorization', function() {
	
	var testUser = {
		id: 1
	};
	
	before(function() {
	
		var fakeRoles = [
			{
				id: 1,
				name: "Role 1",
				permissions: [{id: 1, name: "localPermission"}]
			},
			{
				id: 2,
				name: "Role 2",
				permissions: [{id: 2, name: "globalPermission"}]
			}
		]
		
		var rolesMock = {
			find: function(ids) {
				var roles = _.filter(fakeRoles, function(r) {
					return _.indexOf(ids.id, r.id) >= 0;
				})
				var promise = Promise.resolve(roles);
				promise.populate = function() { return promise; }
				return promise;
			}
		}
		
		service.__set__('roles', rolesMock);
		
		
		var fakeUserRoles = [
			{
				user: 1,
				role: 1,
				scope: "testScope"
			},
			{
				user: 1,
				role: 2
			}
		]
				
		var userServiceMock = {
			getRolesForUser: function() { return Promise.resolve(fakeUserRoles); }
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