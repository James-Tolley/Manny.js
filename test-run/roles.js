var should = require('should'),
	request = require('supertest'),
	Promise = require('bluebird'),
	server = require('./lib/server'),
	url = server.host,
	apiRoot = server.options.root;


/*global describe, before, it*/
describe('Roles', function() {
	var links = {};

	before(function(done) {
		// Get Api Root info
		request(url)
		.get(apiRoot)
		.end(function(err, res) {
			if (err) { throw err; }
			links = res.body._links;
			done();
		});		
	})
		
	function login(username, password) {
		return new Promise(function(resolve, reject) {
			request(url)
			.post(links.login.href)
			.auth(username, password)
			.end(function(err, res) {
				
				if (err) { reject(err); }
				else {
					links.me = res.body._links.self;
					resolve(res.body.access_token);
				}
			});
		});
	}
	
	describe('If I have permission', function() {
		
		var accessToken,
			testRole;
		
		before(function(done) {
			var admin = require('./setup.json').admin;

			login(admin.email, admin.password).then(function(token) {
				accessToken = token;
				
				request(url)
				.get(apiRoot)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(200)
				.end(function(err, res) {
					if (err) { throw err}
					else {
						links.roles = res.body._links.roles;
						done();
					}
				});
			})
		})
				
		it('Should let me see existing roles', function(done) {
			
			request(url)
			.get(links.roles.href)
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				res.status.should.equal(200);
				links.createRole = res.body._links.create;
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
				testRole._links.should.have.property('update');
				testRole._links.should.have.property('delete');					
				done();
			});
		});
		
		
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
	 });
	
	describe('If I do not have permission', function() {
		
		var accessToken;
		
		before(function(done) {
	
			var testUser = {
				email: Date.now() + '@example.com',
				password: 'secret'
			}
			
			request(url)
			.post(links.register.href)
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
		
		it('Should not let me access the role api directly', function(done) {
			
			return request(url)
			.get(links.roles.href)
			.set('Authorization', 'JWT ' + accessToken)
			.expect(403)
			.end(function(err, res) {
				if (err) { throw err };
				done();
			});
		})		
	})
});