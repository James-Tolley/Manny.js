var should = require('should'),
	assert = require('assert'),
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

	it("Should exchange valid login details for a bearer token", function(done) {
		request(url)
		.post('/api/token')
		.auth('user@example.com', 'password')
		.end(function(err, res) {
			if (err) {
				throw err;
			}
			res.should.have.property('status', 200);
			res.body.should.have.property('access_token');

			done();
		})
	});

	it("Should allow access via an access token", function(done) {
		var token;

		request(url)
		.post('/api/token')
		.auth('user@example.com', 'password')
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