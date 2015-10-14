var should = require('should'),
	request = require('supertest'),
	server = require('./lib/server'),
	url = server.host,
	apiRoot = server.options.root;

/*global describe, before, it*/
describe('Hypermedia', function() {
	
	var testUser = {};
	
	before(function(done) {

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
			done();
		});
	});		


	describe('When not logged in', function() {
		it('Should tell me where to go to login', function(done) {
			request(url)
			.get(apiRoot)
			.expect(200)
			.end(function(err, res) {
				res.body._links.should.have.property('login');
				done();
			});			
		});

		it('Should tell me where to go to register an account', function(done) {
			request(url)
			.get(apiRoot)
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
			.post(apiRoot + '/token')
			.auth(testUser.email, testUser.password)
			.expect(200)
			.end(function(err, res) {
				token = res.body.access_token;
				done();
			});
		})

		it('Should tell me where to go to see my details', function(done) {
			request(url)
			.get(apiRoot)
			.set('Authorization', 'JWT ' + token)
			.expect(200)
			.end(function(err, res) {
				res.body._links.should.have.property('me');
				done();
			});					
		})
	})
});