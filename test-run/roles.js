var should = require('should'),
	request = require('supertest'),
	config = require('config'),
	Promise = require('bluebird'),
	url = 'localhost:' + config.get('server.port'),
	apiRoot = config.get('server.root');


function login(username, password) {
	return new Promise(function(resolve, reject) {
		request(url)
		.post(apiRoot + '/token')
		.auth(username, password)
		.end(function(err, res) {
			err ? reject(err) : resolve(res.body.access_token);
		});
	});
}

/*global describe, before, it*/
describe('Roles', function() {
	
	describe('If I have permission', function() {
		
		var accessToken,
			testRole,
			links = {};
		
		before(function() {
			var admin = require('./setup.json').admin;

			return login(admin.email, admin.password).then(function(token) {
				accessToken = token;
			})
		})
		
		describe('Discoverabilty', function() {
		
			it('Should tell me where to find the role management API', function(done) {
							
				request(url)
				.get(apiRoot)
				.set('Authorization', 'JWT ' + accessToken)
				.end(function(err, res) {
					if (err) { throw err; }
					
					res.body._links.should.have.property('roles');
					links.roles = res.body._links.roles;
					done();
				});
			
			});
			
			it('Should let me see existing roles', function(done) {
				
				request(url)
				.get(links.roles.href)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(200)
				.end(function(err, res) {
					if (err) { throw err; }
					res.status.should.equal(200);
					done();
				});
			});
		});
		
		describe('Role creation', function() {
			
		
			it('Should tell me where to go to create a role', function(done) {
				request(url)
				.get(links.roles.href)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(200)
				.end(function(err, res) {
					if (err) { throw err; }
					
					res.body._links.should.have.property('create');
					links.createRole = res.body._links.create;
					done();
				});			
			})
			
			it('Should respond respond with BadRequest if my create model is invalid', function(done) {
				var newRole = {
					name: ''
				}
				
				request(url)
				.post(links.createRole.href)
				.send(newRole)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(400)
				.end(function(err, res) {
					res.status.should.equal(400);
					done();
				});					
			});
			
			it('Should let me create a new role', function(done) {
				var newRole = {
					name: 'role_' + Date.now()
				}
				
				request(url)
				.post(links.createRole.href)
				.send(newRole)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(200)
				.end(function(err, res) {
					if (err) { throw err; }
					testRole = res.body;
					done();
				});
			});
			
			it('Should tell me where to go to modify my new role', function() {
				testRole.should.have.property('_links');
				testRole._links.should.have.property('update');
				testRole._links.should.have.property('delete');
			});
			
		});
		
		
		describe('Updating a role', function() {
			
			it('Should let me update a role', function(done) {
				
				var updatedRole = {
					name: 'role_' + Date.now() 
				}
				
				request(url)
				.put(testRole._links.update.href)
				.send(updatedRole)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(200)
				.end(function(err, res) {
					if (err) { throw err; }
					res.body.id.should.equal(testRole.id);
					res.body.name.should.equal(updatedRole.name);
					done();
				});			
			});
			
			it('Should respond with BadRequest if my update model is wrong', function(done) {
				var updatedRole = {
					name: ''
				}
				
				request(url)
				.put(testRole._links.update.href)
				.send(updatedRole)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(400)
				.end(function(err, res) {
					if (err) { throw err; }
					done();
				});					
			});
			
			it('Should respond with BadRequest if I attempt to update a non-existant role', function(done) {
				var updatedRole = {
					name: 'role_' + Date.now() 
				}
				
				request(url)
				.put(links.roles.href + '/0')
				.send(updatedRole)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(400)
				.end(function(err, res) {
					if (err) { throw err; }
					done();
				});					
			})
			
		});
		
		// describe('Deleting a role', function() {
			
			
			
		// });
	});
	
	describe('If I do not have permission', function() {
		
	
		var accessToken;
		
		before(function(done) {
	
			var testUser = {
				email: Date.now() + '@example.com',
				password: 'secret'
			}
			
			request(url)
			.post(apiRoot + '/register')
			.send({
				name: "Test user",
				email: testUser.email,
				password: testUser.password,
				confirmPassword: testUser.password
			})
			.expect(200)
			.end(function(err, res) {
				if (err) {
					throw err;
				}
				
				login(testUser.email, testUser.password).then(function(token) {
					accessToken = token;
					done();
				})
			});
		});	

		
		it('Should not list the role Api link', function(done) {
			request(url)
			.get(apiRoot)
			.set('Authorization', 'JWT ' + accessToken)
			.end(function(err, res) {
				if (err) { throw err };
				
				res.body._links.should.not.have.property('roles');
				done();
			});

		});
		
		it('Should not let me access the role api directly', function(done) {
			
			return request(url)
			.get(apiRoot + '/roles')
			.set('Authorization', 'JWT ' + accessToken)
			.expect(403)
			.end(function(err, res) {
				if (err) { throw err };
				done();
			});
		})		
	})
});