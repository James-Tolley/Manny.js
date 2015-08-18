var should = require('should'),
	assert = require('assert'),
	request = require('supertest'),
	config = require('config'),
	url = 'localhost:' + config.get('server.port');

describe('Auth', function() {
	

	it("Should return unauthorized if we're not logged in", function(done) {

		request(url)
		.get('/api')
		.end(function(err, res) {
			res.should.have.property('status', 401);
			done();
		});
	});

	it("Should exchange valid login details for a bearer token", function(done) {
		request(url)
		.post('/api/login')
		.auth('user@example.com', 'password')
		.end(function(err, res) {
			if (err) {
				throw err;
			}
			res.should.have.property('status', 200);
			done();
		})
	});
});

describe('Oauth2', function() {

	it('Should exchange client id and login details for a bearer token', function(done) {
		request(url)
		.post('/api/oauth/token')
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

	it('Should exchange a refresh token for a new bearer token')

})