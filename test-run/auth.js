var should = require('should'),
	request = require('supertest'),
	server = require('./lib/server'),
	url = server.host,
	apiRoot = server.options.root;


/*global describe, before, it*/
describe('Auth', function() {
	
	var testUser = {};
	var links = {};
	
	before(function(done) {
		request(url)
		.get(apiRoot)
		.end(function(err, res) {
			if (err) { throw err; }
			links = res.body._links;
			done();
		});		
	})

	
	it("Should allow me to create an account", function(done) {

		testUser = {
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
			res.body.should.have.property('id');
			links.login = res.body._links.login;
			done();
		});
	});

	it("Should reject invalid login details", function(done) {
		request(url)
		.post(links.login.href)
		.auth(testUser.email, 'secret-wrong')
		.expect(401)
		.end(function(err, res) {
			done();
		})			
	});
	
	it("Should exchange valid login details for a bearer token", function(done) {
		request(url)
		.post(links.login.href)
		.auth(testUser.email, testUser.password)
		.expect(200)
		.end(function(err, res) {
			if (err) {
				throw err
			}
			res.body.should.have.property('access_token');
			testUser.token = res.body.access_token;
			links.me = res.body._links.self;
			done();
		})
	});
	
	it("Should return unauthorized if we're not logged in", function(done) {
		request(url)
		.get(links.me.href)
		.end(function(err, res) {
			res.should.have.property('status', 401);
			done();
		});
	});		

	it("Should allow access via an access token", function(done) {

		request(url)
		.get(links.me.href)
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