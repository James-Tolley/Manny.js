var orm = require('./src/collections/orm');	

orm.initialize()
.then(function() {
	return require('./initialConfiguration')();	
})
.then(boot)
.catch(function(e) {
	throw e;
});

function boot() {
	
	var 
		express = require('express'),
		bodyParser = require('body-parser'),
		config = require('config'),
		passport = require('passport'),
		app = express();
	
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());	
	app.use(passport.initialize());
	
	var apiRoot = config.get('server.root');
	require('./routes')(app, apiRoot);
	
	var port = config.get('server.port');
	app.listen(port);
	console.log('Using configuration: ' + app.settings.env);
	console.log('Api available at localhost:' + port + apiRoot);	
}



