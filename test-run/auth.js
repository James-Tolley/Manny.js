var should = require('should'),
	request = require('supertest'),
	config = require('config'),
	url = 'localhost:' + config.get('server.port');

describe('Auth', function() {
	

	it("Should return unauthorized if we're not logged in", function(done) {

		request(url)
		.get('/api/me')
		.end(function(err, res) {
			res.should.have.property('status', 401);
			done();
		});
	});

	describe("When I don't have an account", function() {

		it("Should allow me to create one", function(done) {

			request(url)
			.post('/api/register')
			.send({
				name: "Test user",
				email: "test@example.com",
				password: "secret",
				confirmPassword: "secret"
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
			.post('/api/register')
			.send({
				name: "Test user 2",
				email: "test@example.com",
				password: "secret",
				confirmPassword: "secret"
			}).expect(400)
			.end(function(err, res) {
				res.body.message.should.match(/Email/i);
				done();
			});
		});

		it("It should tell me if my passwords do not match", function(done) {
			request(url)
			.post('/api/register')
			.send({
				name: "Test user 2",
				email: "test2@example.com",
				password: "secret",
				confirmPassword: "secret-wrong"
			}).expect(400)
			.end(function(err, res) {
				res.body.should.match(/password/i);
				done();
			});
		});
	})

	describe("When I have an account", function() {

		it("Should exchange valid login details for a bearer token", function(done) {
			request(url)
			.post('/api/token')
			.auth('test@example.com', 'secret')
			.expect(200)
			.end(function(err, res) {
				if (err) {
					throw err
				}
				res.body.should.have.property('access_token');
				done();
			})
		});

		it("Should allow access via an access token", function(done) {
			var token;

			request(url)
			.post('/api/token')
			.auth('test@example.com', 'secret')
			.expect(200)
			.end(function(err, res) {
				token = res.body.access_token;

				request(url)
				.get('/api/me')
				.set('Authorization', 'JWT ' + token)
				.expect(200)
				.end(function(err, res) {
					if (err) {
						throw err;
					}

					res.should.have.property('status', 200);

					done();
				});			
			})

		});
	});

});