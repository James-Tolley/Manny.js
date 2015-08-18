/* Only using crypto as I can't get bcrypt to compile */
var crypto = require('crypto');

var User = function(data) {
	var _original = data;

	var id = _original.id;
	var password = _original.password;
	var salt = _original.salt;

	this.name = _original.name;
	this.email = _original.email;
	this.salt = _original.salt;

	Object.defineProperties(this, {
		"id": {
			get: function() { return id; }
		},
		"password": {
			get: function() { return password; }
			set: function(value) { updatePassword(value); }
		},
	});		
}

User.prototype = {
	checkPassword = function(password) {
		return encryptPassword(password, this.salt) == this.password;
	}

	updatePassword = function(password) {
		this.salt = crypto.randomBytes(64).toString('hex');
		this.password = encryptPassword(password, this.salt);
	}
};

function encryptPassword(password, salt) {
	return crypto.pbkdf2Sync(password, salt, 10000, 512);
}

module.exports = User;