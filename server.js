var 
	express = require('express'),
	bodyParser = require('body-parser'),
	config = require('config'),
	passport = require('passport');

// Controllers
var auth = require('./src/controllers/authentication');


/* Api Router configuration */
var router = express.Router();

// Require jwt token for all api routes
router.all('/*', passport.authenticate('jwt', { session: false}), function (req, res, next) {
	next();
})

router.get('/', function(req, res) {
		res.json({ userId: req.user.id, name: req.user.name, email: req.user.email, scope: req.authInfo.scope });
 	}
);


var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());	
app.use(passport.initialize());

app.post('/token', auth.token);
app.use('/api', router);

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



