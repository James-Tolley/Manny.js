var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	_ = require('lodash'),
	Promise = require('bluebird'),
	userService = rewire('../src/services/users');
	
/*global describe, beforeEach, it*/
describe("Users", function() {
	
	var testRole = {
		id: 1,
		name: "Test Role"
	};
	
	describe("Adding roles", function() {
	
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
				findRole: function() { return testRole }
			}
			
			userService.__set__("users", usersMock);
			userService.__set__("roleService", roleServiceMock);		
		});
		
		it("Can assign a role to a user globally", function() {
		
		
			return userService.assignRoleToUser({
				id: 1
			}, testRole.name)
			.then(function(user) {
				var newRole = _.find(user.roles, function(userRole) {
					return userRole.role.name === testRole.name && (!userRole.role.scope);
				});
				
				should.exist(newRole);
			})
		});
		
		it("Can assign a role to a user with scope", function() {	
			return userService.assignRoleToUser({
				id: 1
			}, testRole.name, "scope1")
			.then(function(user) {
				var newRole = _.find(user.roles, function(userRole) {
					return (userRole.role.name === testRole.name) && (userRole.scope === "scope1");
				});
				
				should.exist(newRole);
			})
		});	
		
		it("Can assign a role to a user mulitple times with different scopes", function() {
			
			return userService.assignRoleToUser({id: 1}, testRole.name)
			.then(function() {
				return userService.assignRoleToUser({id: 1}, testRole.name, "scope1");
			}).then(function() {
				return userService.assignRoleToUser({id: 1}, testRole.name, "scope2");
			}).then(function(user) {
				var role1 = _.find(user.roles, function(userRole) {
					return (userRole.role.name === testRole.name) && (userRole.scope === "scope1");
				});
				var role2 = _.find(user.roles, function(userRole) {
					return (userRole.role.name === testRole.name) && (userRole.scope === "scope2");
				});
				var role3 = _.find(user.roles, function(userRole) {
					
					return (userRole.role.name === testRole.name) && (!userRole.scope);
				});			
				
				should.exist(role1);
				should.exist(role2);
				should.exist(role3);
			});		
		});
	});
	
	describe("Removing roles", function() {
		beforeEach(function() {
			var userMock = { 
				userId: 1, 
				roles: [{
					role: 1,
					user: 1,
					scope: ""
				},{
					role: 1,
					user: 1,
					scope: "local"
				}
				] 
			};
			userMock.save = function() { return this;}
			
			var findMock = Promise.resolve(userMock);
			findMock.populate = function() { return this; }	
			
			var usersMock = {
				findOne: function() { return findMock; }
			}
			
			var roleServiceMock = {
				findRole: function() { return testRole }
			}
			
			userService.__set__("users", usersMock);
			userService.__set__("roleService", roleServiceMock);				
		});
		
		it("Can remove a role from a user", function() {
			return userService.removeRoleFromUser({id: 1}, testRole.name)
			.then(function(user) {
				user.roles.length.should.equal(1);
			});
		});
		
		it("Should only remove a role at the scope specified", function() {
			return userService.removeRoleFromUser({id: 1}, testRole.name, "local")
			.then(function(user) {
				user.roles[0].scope.should.equal("");
			});			
		});
		
		it("Should not remove local scope roles when removing globally", function() {
			return userService.removeRoleFromUser({id: 1}, testRole.name, "")
			.then(function(user) {
				user.roles[0].scope.should.equal("local");
			});						
		});
	});
});