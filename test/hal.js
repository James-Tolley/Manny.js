var should = require('should'),
	assert = require('assert'),
	request = require('supertest'),
	config = require('config'),
	url = 'localhost:' + config.get('server.port');

describe('Hypermedia', function() {

	describe('When not logged in', function() {
		it('Should tell me where to go to login', function(done) {
			request(url)
			.get('/api')
			.expect(200)
			.end(function(err, res) {
				res.body._links.should.have.property('login');
				done();
			});			
		});

		it('Should tell me where to go to register an account', function(done) {
			request(url)
			.get('/api')
			.expect(200)
			.end(function(err, res) {
				res.body._links.should.have.property('register');
				done();
			});			
		});
	});

	describe('When logged in', function() {
		var token;

		before(function(done) {
			request(url)
			.post('/api/token')
			.auth('user@example.com', 'password')
			.expect(200)
			.end(function(err, res) {
				token = res.body.access_token;
				done();
			});
		})

		it('Should tell me where to go to see my details', function(done) {
			request(url)
			.get('/api')
			.set('Authorization', 'JWT ' + token)
			.expect(200)
			.end(function(err, res) {
				res.body._links.should.have.property('me');
				done();
			});					
		})
	})
});