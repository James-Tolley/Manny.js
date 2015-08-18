var config = require('config'),
	repositoryType = config.database || 'basic';

var factory = {};

factory.prototype.getRepository = function(obj) {

}

module.exports = factory;
