var should = require('should'),
	request = require('supertest'),
	config = require('config'),
	url = 'localhost:' + config.get('server.port'),
	apiRoot = config.get('server.root');

/*global describe, before, it*/
describe('Auth', function() {
	
	var testUser = {};
	
	it("Should return unauthorized if we're not logged in", function(done) {

		request(url)
		.get(apiRoot + '/me')
		.end(function(err, res) {
			res.should.have.property('status', 401);
			done();
		});
	});

	describe("When I don't have an account", function() {

		it("Should allow me to create one", function(done) {

			testUser = {
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
				res.body.should.have.property('id');
				done();
			});
		});

		it("Should tell me if the email address is already in use", function(done) {
			request(url)
			.post(apiRoot + '/register')
			.send({
				name: "Test user 2",
				email: testUser.email,
				password: "secret",
				confirmPassword: "secret"
			}).expect(400)
			.end(function(err, res) {
				res.body.error.should.match(/Email/i);
				done();
			});
		});

		it("It should tell me if my passwords do not match", function(done) {
			request(url)
			.post(apiRoot + '/register')
			.send({
				name: "Test user 2",
				email: "test2@example.com",
				password: "secret",
				confirmPassword: "secret-wrong"
			}).expect(400)
			.end(function(err, res) {
				res.body.error.should.match(/password/i);
				done();
			});
		});
	})

	describe("When I have an account", function() {

		it("Should reject invalid login details", function(done) {
			request(url)
			.post(apiRoot + '/token')
			.auth(testUser.email, 'secret-wrong')
			.expect(401)
			.end(function(err, res) {
				done();
			})			
		});
		
		it("Should exchange valid login details for a bearer token", function(done) {
			request(url)
			.post(apiRoot + '/token')
			.auth(testUser.email, testUser.password)
			.expect(200)
			.end(function(err, res) {
				if (err) {
					throw err
				}
				res.body.should.have.property('access_token');
				testUser.token = res.body.access_token;
				done();
			})
		});

		it("Should allow access via an access token", function(done) {

			request(url)
			.get(apiRoot + '/me')
			.set('Authorization', 'JWT ' + testUser.token)
			.expect(200)
			.end(function(err, res) {
				if (err) {
					throw err;
				}

				res.should.have.property('status', 200);
				done();
			});	
		});		
		
	});

});