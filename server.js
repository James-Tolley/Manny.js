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
	
	app.use(function(err, req, res, next) {
		if (err.name == 'ServiceError') {
			return res.json(400, { message: err.message } );
		}
		return next(err);
	});
	
	var port = config.get('server.port');
	app.listen(port);
	console.log('Using configuration: ' + app.settings.env);
	console.log('Api available at localhost:' + port + apiRoot);	
}



