var 
	express = require('express'),
	bodyParser = require('body-parser'),
	config = require('config'),
	passport = require('passport');


var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());	
app.use(passport.initialize());

require('./routes')(app, '/api');

/* Run app */

var orm = require('./src/collections/orm');

orm.initialize().then(function(models) {
	app.models = models.collections;
	app.connections = models.connections;

	var port = config.get('server.port');
	app.listen(port);
	console.log('Listening on port ' + port);
	
}).catch(function(e) {
	throw e;
});



