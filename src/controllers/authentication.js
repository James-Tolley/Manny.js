var authService = require('../services/authentication'),
	passport = require('passport'),
	Promise = require('bluebird');

var controller = {

	token: function(req, res, next) {
		if (!req.user) {
			return res.json(401);
		}

		Promise.resolve(authService.issueToken(req.user)).then(function(token) {
			return res.json({
				user_id: req.user.id,
				user_name: req.user.name,
				email: req.user.email,
				access_token: token
			});	
		})	


		// var username = req.params.username,
		// 	password = req.params.password;

		// authService.login(username, password)
		// .then(function() {
		// 	res.json({message: 'Logged in!'});
		// })
	}

}

exports.token = [
	passport.authenticate('basic', {session: false}),
	controller.token
]