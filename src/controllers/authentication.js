var authService = require('../services/authentication'),
	passport = require('passport');

var controller = {

	login: function(req, res) {
		res.json({message: 'hi'});
		// var username = req.params.username,
		// 	password = req.params.password;

		// authService.login(username, password)
		// .then(function() {
		// 	res.json({message: 'Logged in!'});
		// })
	}

}

exports.login = [
	passport.authenticate('basic', {session: false}),
	controller.login
]