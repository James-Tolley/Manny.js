var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	userService = rewire('../src/services/users');
	
/*global describe, beforeEach, it*/
describe("Users", function() {
	
	beforeEach(function() {
		var userMock = { 
			userId: 1, 
			roles: [] 
		};
		userMock.save = function() { return this;}
		
		var findMock = Promise.resolve(userMock);
		findMock.populate = function() { return this; }	
		
		var usersMock = {
			findOne: function() { return findMock; }
		}
		
		var roleServiceMock = {
			findRole: function() { return {id: 1, name: "Test Role" }}
		}
		
		userService.__set__("users", usersMock);
		userService.__set__("roleService", roleServiceMock);		
	});
	
	it("Can assign a role to a user globally", function() {
	
	
		return userService.assignRoleToUser({
			id: 1
		}, "Test Role")
		.then(function(user) {
			var newRole = _.find(user.roles, function(userRole) {
				return userRole.role.name === "Test Role" && (!userRole.role.scope);
			});
			
			should.exist(newRole);
		})
	});
	
	it("Can assign a role to a user with scope", function() {	
		return userService.assignRoleToUser({
			id: 1
		}, "Test Role", "scope1")
		.then(function(user) {
			var newRole = _.find(user.roles, function(userRole) {
				return (userRole.role.name === "Test Role") && (userRole.scope === "scope1");
			});
			
			should.exist(newRole);
		})
	});	
	
	it("Can assign a role to a user mulitple times with different scopes", function() {
		
		return userService.assignRoleToUser({id: 1}, "Test Role")
		.then(function() {
			return userService.assignRoleToUser({id: 1}, "Test Role", "scope1");
		}).then(function() {
			return userService.assignRoleToUser({id: 1}, "Test Role", "scope2");
		}).then(function(user) {
			var role1 = _.find(user.roles, function(userRole) {
				return (userRole.role.name === "Test Role") && (userRole.scope === "scope1");
			});
			var role2 = _.find(user.roles, function(userRole) {
				return (userRole.role.name === "Test Role") && (userRole.scope === "scope2");
			});
			var role3 = _.find(user.roles, function(userRole) {
				
				return (userRole.role.name === "Test Role") && (!userRole.scope);
			});			
			
			should.exist(role1);
			should.exist(role2);
			should.exist(role3);
		});		
	});
});