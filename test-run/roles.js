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
			console.log(err);
			err ? reject(err) : resolve(res.body.access_token);
		});
	});
}

/*global describe, before, it*/
describe('Roles', function() {
	
	describe('If I have permission', function() {
		
		it('Should tell me where to find the role management API', function(done) {
						
			login('admin@example.com', 'password').then(function(token) {
				return request(url)
				.get('/api')
				.set('Authorization', 'JWT ' + token)
				.end(function(err, res) {
					if (err) { throw err };
					
					res.body._links.should.have.property('roles');
				});
			}).finally(function() {
				done();
			})
		})
		
	});
});