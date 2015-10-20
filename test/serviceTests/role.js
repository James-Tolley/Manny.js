var should = require('should'),
	sinon = require('sinon'),
	rewire = require('rewire'),
	Promise = require('bluebird'),
	errors = require('../../src/services/errors'),
	service = rewire('../../src/services/roles');
	
/*global describe, before, it*/
describe('Role management', function() {
	
	describe('Finding', function() {
	
		it('Can list all roles', function() {
			
			var data = [{id:1}, {id:2}];
			
			var repo = {
				find: function(){ return Promise.resolve(data); }
			}
			service.__set__('roles', repo);
			return service.roles().then(function(roles) {
				roles.length.should.equal(data.length);
			});
			
		});
		
		describe('Finding a role', function() {
		
			it('Can find a role by name', function() {
				var repo = {
					findOne: function() { return Promise.resolve({id: 1});}
				}
				service.__set__('roles', repo);
				return service.findRole('test').then(function(role) {
					should.exist(role);
				});
			});
			
			it('Returns null if no role found', function() {
				var repo = {
					findOne: function() { return Promise.resolve(null);}
				}
				service.__set__('roles', repo);
				return service.findRole('test').then(function(role) {
					should.not.exist(role);
				});				
			});
			
		})
		
		describe('Loading a role', function() {
			it('Can load a role by Id', function() {
				var repo = {
					findOne: function() { return Promise.resolve({id: 1});}
				}
				service.__set__('roles', repo);
				return service.loadRole(1).then(function(role) {
					should.exist(role);
				});				
			});
			
			it('Throws an error if role does not exist', function() {
				var repo = {
					findOne: function() { return Promise.resolve(null);}
				}
				service.__set__('roles', repo);
				return service.loadRole(1).then(function(role) {
					throw new Error("Failed");
				}).catch(errors.ServiceError, function(e) {
					e.message.should.match(/not exist/i);
				})
			});
		});
		 
	})
	
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
				roleMock.create.calledOnce.should.be.true();
				should.exist(role);
			});
		});
		
	});	
	
	describe('Updating a role', function() {
				
		it('Cannot be updated to a blank name', function() {
			return service.updateRole(1, {name: ''})
			.then(function() {
				throw new Error("Should have failed")
			}).catch(function(err) {
				err.message.should.match(/name/i);
			})
		});
		
		it('Cannot be updated to a duplicate name', function() {
			var roleMock = {
				findOne: function(opts) { 
					return Promise.resolve({id: opts.id || 1, name: opts.name || 'role'}); 
				}
			}
			service.__set__("roles", roleMock);
						
			return service.updateRole(2, {name: 'role'})
			.then(function() {
				throw new Error("Should have failed")
			}).catch(function(err) {
				err.message.should.match(/exists/i);
			})			
		});
		
		it('Can update a role name', function() {
		
			var fakeRole = {id: 1, name: 'role'};
			fakeRole.save = sinon.stub().returns(Promise.resolve(fakeRole));
			var roleMock = {
				findOne: function(opts) { 
					return Promise.resolve(fakeRole); 
				}
			}
			
			service.__set__("roles", roleMock);
				
			return service.updateRole(1, {name: 'blah'})
			.then(function(role) {
				fakeRole.save.calledOnce.should.be.true();
				role.name.should.equal('blah');
			});
		});		
	});
	
	describe('Deleting a role', function() {
		
		it('Cannot delete a non-existent role', function() {
			var roleMock = {
				findOne: function(opts) { 
					return Promise.resolve(null); 
				},
			}
			
			service.__set__("roles", roleMock);
			return service.deleteRole(1).then(function() {
				throw new Error("Should have failed");
			}).catch(errors.NotFoundError, function(err) {
				should.exist(err);
			});	
		});
		
		it('Can delete a role', function() {
			var roleMock = {
				findOne: function(opts) { 
					return Promise.resolve({id: opts.id || 1, name: opts.name || 'role'}); 
				},
				destroy: sinon.stub().returns(Promise.resolve(true))
			}
			
			service.__set__("roles", roleMock);
			return service.deleteRole(1).then(function() {		
				roleMock.destroy.calledOnce.should.be.true();
				
			})
		})
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
	});
	
	describe('Finding', function() {
		it('Can find by name', function() {
			var permissions = {
				findOne: function() { return Promise.resolve({id: 1}); }
			}
			service.__set__('permissions', permissions);
			return service.findPermission('test').then(function(permission) {
				should.exist(permission);
			});
		});
		
		it('Returns null if not found', function() {
			var permissions = {
				findOne: function() { return Promise.resolve(null); }
			}
			service.__set__('permissions', permissions);
			return service.findPermission('test').then(function(permission) {
				should.not.exist(permission);
			});			
		});
	})
	
	it('Can grant a permission to a role', function() {
		var permissionMock = {
			findOne : sinon.stub().returns(Promise.resolve({id: 1, name: 'permission one'}))
		};

		var permissions = [];
		permissions.add = sinon.spy();
		 
		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: permissions,
			save: function() { return Promise.resolve(true); }
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: sinon.stub().returns(rolePromise)
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.grantPermission('role one', 'permission one').then(function() {
			permissions.add.calledOnce.should.be.true();
		})
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
	
	it('Can remove a permission from a role', function() {
		
		var permissionMock = {
			findOne : function() { return Promise.resolve({id: 1, name: 'permission one'}); }
		};
		var permissions = [{id: 1, name: 'permission one'}];
		permissions.remove = sinon.spy(); 

		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: permissions,
			save: function() { return Promise.resolve(true); }
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: function() { return rolePromise; }
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.removePermission('role one', 'permission one').then(function() {
			permissions.remove.calledOnce.should.be.true();
		});
	});	
	
	it('Cannot remove a permission a role does not have', function() {
		var permissionMock = {
			findOne : function() { return Promise.resolve({id: 1, name: 'permission one'}); }
		};
		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [],
			save: function() { return Promise.resolve(true); }
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: function() { return rolePromise; }
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.removePermission('role one', 'permission one').then(function() {
			throw new Error("Failed");
		}).catch(errors.ServiceError, function(e) {
			e.message.should.match(/does not have/i);
		});
	});
	
	it('Cannot remove a permission that does not exist', function() {
		var permissionMock = {
			findOne : function() { return Promise.resolve(null); }
		};
		var rolePromise = Promise.resolve({
			id: 1, 
			name: 'role one', 
			permissions: [],
			save: function() { return Promise.resolve(true); }
		});
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: function() { return rolePromise; }
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.removePermission('role one', 'permission one').then(function() {
			throw new Error("Failed");
		}).catch(errors.ServiceError, function(e) {
			e.message.should.match(/does not exist/i);
		});		
	});
	
	it('Cannot remove a permission from a role that does not exist', function() {
		var permissionMock = {
			findOne : function() { return Promise.resolve({id: 1, name: 'permission one'}); }
		};
		var rolePromise = Promise.resolve(null);
		rolePromise.populate = function(name) {
			return this;
		}			
		var roleMock = {
			findOne	: function() { return rolePromise; }
		}
		
		service.__set__('roles', roleMock);
		service.__set__('permissions', permissionMock);
		
		return service.removePermission('role one', 'permission one').then(function() {
			throw new Error("Failed");
		}).catch(errors.ServiceError, function(e) {
			e.message.should.match(/does not exist/i);
		});				
	});
});