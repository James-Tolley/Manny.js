# Skynet #

Sample application for possible blossoming into the eventual Curious Pastimes plot management app.

Application provides login via username and password which it exchanges for a Json Web Token (jwt). The Api functions all require a valid JWT for access.

## Install ##

```
> git clone https://JamesTolley@bitbucket.org/JamesTolley/skynet.git
> npm install
> npm start
```

## Directory Structure ##

 - server.js - Main application file
 - routes.js - Api route initialization
 - initialConfiguration - Initial setup
 - /node_modules - Dependencies
 - /config
    - default.js - Default configuration
 - /middleware - Custome Express middleware
 - /src
    - /collections - ORM Collections
        - orm.js   - ORM initialization
    - /controllers - Api controllers.
    - /services    - Business logic
 - /test - Mocha unit tests
 - /test-run - Mocha integration tests
  
## Documentation ##

### Api ###

Api documentation can be manually generated using apidoc

```
npm run apidoc
```

## Configuration ##

Configuration is done via [config.js](https://github.com/lorenwest/node-config). Refer to documentation there for information.

Default Configuration file is in `/config/default.json`
```
{
    // application server configuration
    "server": {
        "port": 1337,       // http port app should listen on
        "root": "",         // root url for api controllers. Do not use trailing slashes. Leave blank or path with leading slash only "/path/api"
        "useHttps": true,   // Enable https
        "key" : "cert/key.pem", // TLS Key
        "cert" : "cert/cert.pem" // TLS Certificate  
    },

    // ORM configuration
    "orm": {
        // Applications uses waterline as it's ORM
        "waterline": {
            "adapters": {
                // Adapter name and name of adapter module. This will be resolved properly on startup
                "memory": "sails-memory" 
            },
            "connections": {
                "default": {
                    // Name of adapter to use for default connection
                    "adapter": "memory"
                 }
            }
        }
    },
    "security": {
        // JSON Web Token configuration
        "jwt": {
            "secretOrKey": "my-secret-key", 
            "issuer": "skynet.example.com", 
            "expiresIn": 3600
        },
        // User password configuration
		"password": {
			"minLength": 4
		}        
    }
}
```

## Https ##

Enable https in the configuration file by setting useHttps to true and setting the key and cert paths accordingly.

## Initial Setup ##

If the application has never been run before, it requires an admin account to be specified before it will boot. 
This can either be specified via answering the command line prompts, or provided via a json file like so:

```
> node server.js --setup=./mysetup.json
Application has not been configured yet. Performing initial setup
Using configuration file
Listening on port 1337
```

The format of the file is

```
{
	"admin": {
		"email": "email@example.com",
		"password": "password"
	}
}
```

## Dependencies ##

All dependencies are in package.json and can be installed with `npm install`

Skynet depends on the following packages:
 - [express](http://expressjs.com/)
 - [body-parser](https://github.com/expressjs/body-parser)
 - [config](https://github.com/lorenwest/node-config)
 - [bluebird](https://github.com/petkaantonov/bluebird)
 - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
 - [passport](http://passportjs.org/)
 - [passport-jwt](https://github.com/themikenicholson/passport-jwt)
 - [passport-http](https://github.com/jaredhanson/passport-http)
 - [waterline](https://github.com/balderdashy/waterline)
 - [sails-memory](https://github.com/balderdashy/sails-memory)
 - [lodash](https://lodash.com/)
 - [hal](https://github.com/naholyr/js-hal)
 - [read](https://github.com/isaacs/read)
 
## Testing ##

Unit tests and integration tests are written in mocha. 

###Unit tests###

run

```
> npm test
```

Code Coverage

```
> npm run cover
```

Coverage report is output to 
```
.\coverage\lcov-report\index.html
```

###Integration tests###

start the application in test mode

```
> npm run start-test
```

then in a seperate console run:

```
> npm run test-run
```