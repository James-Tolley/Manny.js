var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	service = rewire('../src/services/roles');
	
/*global describe, it*/
describe('Role management', function() {
	
	describe('Role creation', function() {
		
		it('Requires a role name', function() {
			return service.createRole('')
			.then(function(role) {
				throw new Error("failed")
			})
			.catch(function(err) {				
				err.message.should.match(/name/i);
			});
		});
		
		it('Rejects duplicate role names', function() {
			var roleMock = {
				findOne: sinon.stub().returns(Promise.resolve({name: 'role'}))
			}
			
			service.__set__("roles", roleMock);
						
			return service.createRole('role').then(function(role) {
				throw new Error("failed");
			}).catch(function(err) {
				err.message.should.match(/exists/i);
			});
		});
		
		it('Can create a new role', function() {
			var roleMock = {
				findOne: sinon.stub().returns(Promise.resolve(null)),
				create: sinon.stub().returns(Promise.resolve({id: 1, role: 'role'}))
			}
			
			service.__set__("roles", roleMock);			
			return service.createRole('role').then(function(role) {
				should.exist(role);
			});
		});
		
	});	
});

describe('Permission management', function() {
					
		
	it('Can list all permissions in the system', function() {

		var permissionMock = {
			find: sinon.stub().returns(Promise.resolve([
				{name: 'permission one'},
				{name: 'permission two'},
				{name: 'global permission'}
			]))
		}
				
		service.__set__('permissions', permissionMock);
		
		return service.permissions().then(function(permissions) {
			permissions.length.should.equal(3);
		});
	})
	
	it('Can grant a permission to a role', function() {
		

		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'permission one'}))
		};

		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [],
			save: function() { return Promise.resolve(true);}
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'permission one');
	});
	
	it('Cannot add a global permission to a role containing scopable permissions', function() {
		
		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'global permission', isGlobal: true}))
		};

		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [{
				id: 2,
				name: 'permission one',
				isGlobal: false
			}],
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'global permission')
		.then(function(role) {
			throw new Error("fail");
		}).catch(function(err) {
			err.message.should.match(/global/i)
		});
	});
	
	it('Cannot add a scopable permission to a role containing global permissions', function() {
		
		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'local permission', isGlobal: false}))
		};

		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [{
				id: 2,
				name: 'global permission',
				isGlobal: true
			}],
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'local permission')
		.then(function(role) {
			throw new Error("fail");
		}).catch(function(err) {
			err.message.should.match(/global/i)
		})
	});	
	
	it('Cannot add a duplicate permission', function() {
		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'local permission', isGlobal: false}))
		};

		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [{
				id: 1,
				name: 'local permission',
				isGlobal: true
			}],
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'local permission')
		.then(function(role) {
			throw new Error("fail")
		}).catch(function(err) {
			err.message.should.match(/already/i)
		});			
	});
	
	it('Cannot add a permission to a nonexistant role', function() {
		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'local permission', isGlobal: false}))
		};

		var rolePromise = Promise.resolve(null);
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'local permission')
		.then(function(role) {
			throw new Error("fail");
		}).catch(function(err) {
			err.message.should.match(/exist/i)
		});			
	});	
	
	it('Cannot add a non-existant permission to a role', function() {
		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve(null))
		};

		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [{
				id: 1,
				name: 'local permission',
				isGlobal: true
			}],
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'local permission')
		.then(function(role) {
			throw new Error("fail");
		}).catch(function(err) {
			err.message.should.match(/exist/i)
		});			
	});				
});