var 
	express = require('express'),
	bodyParser = require('body-parser'),
	config = require('config'),
	passport = require('passport');

// Controllers
	auth = require('./src/controllers/authentication'),
	oauth2 = require('./src/controllers/oauth2');

/* Api Router configuration */
var router = express.Router();

router.post('/login', auth.login);
router.post('/oauth/token', oauth2.token);

router.get('/', passport.authenticate('bearer', { session: false}),
	function(req, res) {
		res.json({ userId: req.user.id, name: req.user.name, scope: req.authInfo.scope });
 	}
);


var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());	
app.use(passport.initialize());
app.use('/api', router);

/* Run app */
var port = config.get('server.port');
app.listen(port);
console.log('Listening on port ' + port);