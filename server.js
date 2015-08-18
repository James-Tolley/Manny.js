/* App setup */
var 
	express = require('express'),
	bodyParser = require('body-parser'),
	config = require('config'),
	passport = require('passport'),
	authentication = require('./src/services/authentication');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());	

var oauth2 = require('./src/services/oauth2');
app.use(passport.initialize());
app.post('/oauth/token', oauth2.token);

/* Api Router configuration */
var router = express.Router();

router.get('/', passport.authenticate('bearer', { session: false}),
	function(req, res) {
		res.json({ userId: req.user.id, name: req.user.name, scope: req.authInfo.scope });
 	}
);

app.use('/api', router);

/* Run app */
var port = config.get('server.port');
app.listen(port);
console.log('Listening on port ' + port);