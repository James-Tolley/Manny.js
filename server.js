var orm = require('./src/collections/orm');	

orm.initialize()
.then(function() {
	return require('./initialConfiguration')();	
})
.then(boot)
.catch(function(e) {
	throw e;
});

function getHost(options) {
	var protocol = options.useHttps ? 'https' : 'http';
	var defaultPort = options.useHttps ? 443 : 80;
	
	var port = options.port == defaultPort ? '' : ':' + options.port;
	
	return [protocol, '://localhost', port].join('');				
}

function createServer(app, options) {
	
	var port = options.port || (options.useHttps ? 443 : 80);
	
	if (options.useHttps) {
		var fs = require('fs'),
			https = require('https');
			
		var httpsOptions = {
			key: fs.readFileSync(options.key),
			cert: fs.readFileSync(options.cert)
		};
		
		https.createServer(httpsOptions, app).listen(port);
	} else {
		app.listen(port);
	}
	
	console.log('Api available at ' + getHost(options) + options.root);
}

function boot() {
	
	var 
		config = require('config'),
		express = require('express'),
		bodyParser = require('body-parser'),
		passport = require('passport'),
		app = express();
	
	var options = config.get('server');
	
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());	
	app.use(passport.initialize());
		
	require('./routes')(app, options.root);

	console.log('Using configuration: ' + app.settings.env);
	
	createServer(app, options);
}



