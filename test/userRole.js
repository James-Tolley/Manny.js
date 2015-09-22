var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	userService = rewire('../src/services/users');
	
/*global describe,before,it*/
describe("Users", function() {
	
	it("Can assign a role to a user globally", function() {
	
		var findMock = Promise.resolve({ userId: 1 });
		findMock.populate = function() { return this; }	
		
		var usersMock = {
			findOne: function() { return findMock; }
		}
		
		var roleServiceMock = {
			findRole: function() { return {id: 1 }}
		}
		
		userService.__set__("users", usersMock);
		userService.__set__("roleService", roleServiceMock);
		
		return userService.assignRoleToUser({
			id: 1
		}, "Test Role")
		.then(function(roles) {
			var newRole = _.find(roles, function(role) {
				return role.name === "Test Role" && (!role.scope);
			});
			
			should.exist(newRole);
		})
	});
});