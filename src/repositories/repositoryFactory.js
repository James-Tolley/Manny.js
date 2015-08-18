var config = require('config'),
	repositoryType = config.database || 'basic';

var factory = {};

factory.prototype.getRepository = function() {
	
}

exports = factory;
