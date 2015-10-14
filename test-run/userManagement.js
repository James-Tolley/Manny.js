var should = require('should'),
	request = require('supertest'),
	Promise = require('bluebird'),
	server = require('./lib/server'),
	url = server.host,
	apiRoot = server.options.root;

/*global describe, before, beforeEach, it*/
describe('User management', function() {

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
	
		var accessToken;
		
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
						links.users = res.body._links.users;
						links.roles = res.body._links.roles;
						done();
					}
				});
			})
		})
		
		it('Should let me see all users', function(done) {
			request(url)
			.get(links.users.href)
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				res.body._embedded.users.length.should.be.above(0);
				links.user = res.body._embedded.users[0]._links.self;
				done();
			});			
		});
		
		it('Should let me view a user', function(done) {
			request(url)
			.get(links.user.href)
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				links.userRoles = res.body._links.roles;
				res.body.should.have.property('email');
				done();
			});					
		});
		
		describe('User roles', function() {
		
			it('Should let me view user roles', function(done) {
				request(url)
				.get(links.userRoles.href)
				.set('Authorization', 'JWT ' + accessToken)
				.expect(200)
				.end(function(err, res) {
					if (err) { throw err; }
					res.body._embedded.should.have.property('roles');
					links.addRole = res.body._links.add;
					links.removeRole = res.body._links.remove;
					done();
				});	
			});
			
			describe('Assigning roles', function() {
				
				var testRole;
				
				before(function(done) {
					
					//create a role we can use		
					var newRole = {
						name: 'role_' + Date.now()
					}
					
					request(url)
					.post(links.roles.href)
					.send(newRole)
					.set('Authorization', 'JWT ' + accessToken)
					.expect(200)
					.end(function(err, res) {
						if (err) { throw err; }
						testRole = res.body;
						done();
					});
					
				});
				
				it('Should let me assign a role globally', function(done) {
					var addRole = links.addRole.href
						.replace('{roleId}', testRole.id)
						.replace('{scope}', '');
						
					request(url)
					.post(addRole)
					.set('Authorization', 'JWT ' + accessToken)
					.expect(200)
					.end(function(err, res) {
						done();
					});
				});
				
				it('Should let me assign a role at scope', function(done) {
					var addRole = links.addRole.href
						.replace('{roleId}', testRole.id)
						.replace('{scope}', 'scope1');
						
					request(url)
					.post(addRole)
					.set('Authorization', 'JWT ' + accessToken)
					.expect(200)
					.end(function(err, res) {
						done();
					});					
				});
				
			});
		});
		
	});
	
})