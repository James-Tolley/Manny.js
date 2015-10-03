var should = require('should'),
	request = require('supertest'),
	config = require('config'),
	Promise = require('bluebird'),
	url = 'localhost:' + config.get('server.port'),
	apiRoot = config.get('server.root');


function login(username, password) {
	return new Promise(function(resolve, reject) {
		request(url)
		.post(apiRoot + '/token')
		.auth(username, password)
		.end(function(err, res) {
			err ? reject(err) : resolve(res.body.access_token);
		});
	});
}

/*global describe, before, beforeEach, it*/
describe('User management', function() {
	
	describe('If I have permission', function() {
	
		var accessToken,
			links = {};
		
		before(function() {
			var admin = require('./setup.json').admin;

			return login(admin.email, admin.password).then(function(token) {
				accessToken = token;
			})
		})
				
		it('Should tell me where to find users management api', function(done) {
			request(url)
			.get(apiRoot)
			.set('Authorization', 'JWT ' + accessToken)
			.end(function(err, res) {
				if (err) { throw err; }
				
				res.body._links.should.have.property('users');
				links.users = res.body._links.users;
				done();
			});
		});
		
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
				res.body.should.have.property('email');
				done();
			});					
		});
		
		it('Should list user roles', function(done) {
			request(url)
			.get(links.user.href)
			.set('Authorization', 'JWT ' + accessToken)
			.expect(200)
			.end(function(err, res) {
				if (err) { throw err; }
				res.body._embedded.should.have.property('roles');
				done();
			});				
		})
		
	});
	
})