var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	_ = require('lodash'),
	mockResponse = require('./lib/mockResponse'),
	controller = rewire('../../src/controllers/roles'),
	errors = require('../../src/services/errors');

/*global describe, it, beforeEach*/	
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
	});
	
	describe('Role list', function() {
		
		beforeEach(function() {
			var mockRoles = [
				{
					id: 1,
					name: 'role1'
				},
				{
					id: 2,
					name: 'role2'
				}
			];
			
			var mockService = {
				roles: function() { return Promise.resolve(mockRoles); }
			}
			
			controller.__set__('roleService', mockService);
		});
		
		it('Should list roles as embedded resources', function() {
			
			var 
				req = {},
				res = mockResponse();
				
			controller.getRoles(req, res, next);
				
			return res.then(function(response) {
				response.body.should.have.property('_embedded');
				response.body._embedded.should.have.property('roles');
				response.body._embedded.roles.length.should.equal(2);
			});
		});
		
		it('Should include a create link', function() {
			var 
				req = {},
				res = mockResponse();
				
			controller.getRoles(req, res, next);
				
			return res.then(function(response) {
				response.body._links.should.have.property('create');
			});			
		});
		
		it('Should include a link to each role included', function() {
			var 
				req = {},
				res = mockResponse();
				
			controller.getRoles(req, res, next);
				
			return res.then(function(response) {
				response.body._embedded.roles[0]._links.should.have.property('self');
			});			
		});
		
	});
	
	describe('Permissions list', function() {
		
		it('Should list permissions array as the main resource', function() {
			var 
				req = {},
				res = mockResponse();
				
			var mockPermissions = [
				{
					id: 1,
					name: 'permission1'
				},
				{
					id: 2,
					name: 'permission2'
				}
			];
			
			var mockService = {
				permissions: function() { return Promise.resolve(mockPermissions); }
			}
			
			controller.__set__('roleService', mockService);				
				
			controller.getPermissions(req, res, next);
				
			return res.then(function(response) {
				response.body.should.have.property('permissions');
				response.body.permissions.length.should.equal(2);
			});				
		})
		
	});
	
	describe('Individual Role', function() {
				
		it('Can get a role by id', function() {
			var 
				req = {params: {id: 1}},
				res = mockResponse(),
				mockService = {
					loadRole: function(id) { return Promise.resolve({id: id}); }
				}
			controller.__set__('roleService', mockService);
				
			controller.getRole(req, res, next);
				
			return res.then(function(response) {
				response.body._links.should.have.property('self');
			});			
		});
		
		it('Returns 404 if role does not exist', function() {
			var 
				req = {params: {id: 1}},
				res = mockResponse(),
				mockService = {
					loadRole: function(id) { return Promise.reject(new errors.NotFoundError("Role not found")); }
				}
			controller.__set__('roleService', mockService);
				
			controller.getRole(req, res, next);
				
			return res.then(function(response) {
				response.status.should.equal(404);
			});				
		});
		
		it('Includes an update link', function() {
			var 
				req = {params: {id: 1}},
				res = mockResponse(),
				mockService = {
					loadRole: function(id) { return Promise.resolve({id: id}); }
				}
			controller.__set__('roleService', mockService);
				
			controller.getRole(req, res, next);
				
			return res.then(function(response) {
				response.body._links.should.have.property('update');
			});					
		});
		
		it('Includes a delete link', function() {
			var 
				req = {params: {id: 1}},
				res = mockResponse(),
				mockService = {
					loadRole: function(id) { return Promise.resolve({id: id}); }
				}
			controller.__set__('roleService', mockService);
				
			controller.getRole(req, res, next);
				
			return res.then(function(response) {
				response.body._links.should.have.property('delete');
			});					
		});
		
		it('Can update a role', function() {
			var 
				req = {params: {id: 1}},
				res = mockResponse(),
				mockService = {
					updateRole: function(model) { return Promise.resolve(model);}
				}
			controller.__set__('roleService', mockService);
				
			controller.updateRole(req, res, next);
				
			return res.then(function(response) {
				response.status.should.equal(200);
			});					
		});
		
		it('Can delete a role', function() {
			var 
				req = {params: {id: 1}},
				res = mockResponse(),
				mockService = {
					deleteRole: function() { return Promise.resolve(true); }
				}
			controller.__set__('roleService', mockService);
				
			controller.deleteRole(req, res, next);
				
			return res.then(function(response) {
				response.status.should.equal(200);
			});				
		});
	});

	
});
