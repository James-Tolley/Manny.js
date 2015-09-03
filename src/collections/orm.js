var 
	Promise = require('bluebird'),
	config = require('config'),
	Waterline = require('waterline'),
	User = require('./User');

/*
	Convert all adapter names to actual object references.
*/
function initAdapters(o) {

	if (!o.adapters) { 
		return o;
	}

	// Copy for editing.
	var options = JSON.parse(JSON.stringify(o));

	for (var adapterName in options.adapters) {
		if (options.adapters.hasOwnProperty(adapterName)) {

			// Require the adapter
			var adapter = require(options.adapters[adapterName]);
			options.adapters[adapterName] = adapter;
		}
	}

	return options;
}

var orm = {
	collections: {},

	initialize : function() {

		var waterline = new Waterline();

		waterline.loadCollection(User);

		var options = config.get('orm.waterline');
		options = initAdapters(options);
		
		var init = Promise.promisify(waterline.initialize, waterline);
		return init(options).then(function(models) {
			orm.collections = models.collections;
		})
	}
}



module.exports = orm;