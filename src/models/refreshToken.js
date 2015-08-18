var crypto = require('crypto');

var RefreshToken = function(data) {

	this.userId = data.userId;
	this.clientId = data.clientId;
	this.token = data.token || crypto.randomBytes(32).toString('hex');
	this.created = data.created || Date.now;

}
exports = RefreshToken;
