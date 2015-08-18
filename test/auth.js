var should = require('should'),
	assert = require('assert'),
	request = require('supertest'),
	config = require('config');

describe('Oauth2', function() {
	var url = 'localhost:' + config.get('server.port');

	it("Should return unauthorized if we're not logged in", function(done) {

		request(url)
		.get('/api')
		.end(function(err, res) {
			res.should.have.property('status', 401);
			done();
		});
	});

	describe('Http authentication', function() {
		it("Should exchange valid login details for a token", function(done) {
			request(url)
			.post('/oauth/token')
			.auth('user@example.com', 'password')
			.send({
				grant_type: "password"
			})
			.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.should.have.property('status', 200);
				done();
			})
		});
	});

	describe('Client authentication', function() {
		it('Should exchange client id and login details for a token', function(done) {
			request(url)
			.post('/oauth/token')
			.send({
				grant_type: "password",
				client_id: "webapp",
				client_secret: "not-a-secret",
				username: "user@example.com",
				password: "password"
			})
			.end(function(err, res) {
				if (err) {
					throw err;
				}
				res.should.have.property('status', 200);
				done();
			})
		});
	});
})