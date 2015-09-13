var should = require('should'),
	config = require('config'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	service = rewire('../src/services/roles');
	
describe('Role management', function() {
	
	describe('Role creation', function() {
		
		it('Requires a role name', function(done) {
			service.createRole('').then(function(role) {
				should.not.exist(role);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/name/i);
				done();			
			})
		});
		
		it('Rejects duplicate role names', function(done) {
			var roleMock = {
				findOne: sinon.stub().returns(Promise.resolve({name: 'role'}))
			}
			
			service.__set__("roles", roleMock);
						
			service.createRole('role').then(function(role) {
				should.not.exist(role);
				done();
			}).catch(function(err) {
				console.log(err);
				err.should.match(/exists/i);
				done();			
			});
		});
		
		it('Can create a new role', function(done) {
			var roleMock = {
				findOne: sinon.stub().returns(Promise.resolve(null)),
				create: sinon.stub().returns(Promise.resolve({id: 1, role: 'role'}))
			}
			
			service.__set__("roles", roleMock);			
			service.createRole('role').then(function(role) {
				should.exist(role);
				done();
			}).catch(function(err) {
				throw err;
			});			
		});
		
	});
	
	describe('Permission management', function() {
						
			
		it('Can list all permissions in the system', function(done) {

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
				done();
			}).catch(function(err) {
				throw err;
			})
		})
		
		it('Can grant a permission to a role', function(done) {
			

			var permissionMock = {
				findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'permission one'}))
			};

			var rolePromise = Promise.resolve({
				id: 1, 
				name: 'role one', 
				permissions: [],
				save: sinon.stub().returns(Promise.resolve(true))
			});
			rolePromise.populate = function(name) {
				return this;
			}			
			var roleMock = {
				findOne	: sinon.stub().returns(rolePromise)
			}
			
			service.__set__('roles', roleMock);
			service.__set__('permissions', permissionMock);
			
			return service.grantPermission('role one', 'permission one')
			.then(function(role) {
				done();		
			}).catch(function(err) {
				throw err;
			});
			
		});
		
	})
	
	
});