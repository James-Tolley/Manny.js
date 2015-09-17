var should = require('should'),
	request = require('supertest'),
	config = require('config'),
	Promise = require('bluebird'),
	url = 'localhost:' + config.get('server.port');


function login(username, password) {
	return new Promise(function(resolve, reject) {
		request(url)
		.post('/api/token')
		.auth(username, password)
		.end(function(err, res) {
			err ? reject(err) : resolve(res.body.access_token);
		});
	});
}

/*global describe, before, it*/
describe('Roles', function() {
	
	describe('If I have permission', function() {
		
		
		var accessToken;
		
		before(function() {
			var admin = require('./setup.json').admin;

			return login(admin.email, admin.password).then(function(token) {
				accessToken = token;
			})
		})
		
		it('Should tell me where to find the role management API', function(done) {
						
			request(url)
			.get('/api')
			.set('Authorization', 'JWT ' + accessToken)
			.end(function(err, res) {
				if (err) { throw err; }
								
				res.body._links.should.have.property('roles');
				done();
			});
		
		});
		
		it('Should let me see existing roles', function(done) {
			request(url)
			.get('/api/roles')
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				res.status.should.equal(200);
				done();
			});
		});
		
		it('Should tell me where to go to create a role', function(done) {
			request(url)
			.get('/api/roles')
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				
				res.body._links.should.have.property('create');
				done();
			});			
		})
		
		it('Should let me create a new role', function(done) {
			var newRole = {
				name: "test role"
			}
			
			request(url)
			.post('/api/roles')
			.send(newRole)
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				done();
			});
		})
		
	});
	
	describe('If I do not have permission', function() {
		
	
		var accessToken;
		
		before(function(done) {
	
			var testUser = {
				email: Date.now() + '@example.com',
				password: 'secret'
			}
			
			request(url)
			.post('/api/register')
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
			.get('/api')
			.set('Authorization', 'JWT ' + accessToken)
			.end(function(err, res) {
				if (err) { throw err };
				
				res.body._links.should.not.have.property('roles');
				done();
			});

		});
		
		it('Should not let me access the role api directly', function(done) {
			
			return request(url)
			.get('/api/roles')
			.set('Authorization', 'JWT ' + accessToken)
			.expect(403)
			.end(function(err, res) {
				if (err) { throw err };
				done();
			});
		})		
	})
});