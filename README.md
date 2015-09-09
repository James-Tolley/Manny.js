# Skynet #

Sample application for possible blossoming into the eventual Curious Pastimes plot management app.

Application provides login via username and password which it exchanges for a Json Web Token (jwt). The Api functions all require a valid JWT for access.

## Install ##

```
> git clone https://JamesTolley@bitbucket.org/JamesTolley/skynet.git
> npm install
> node server.js
```

## Directory Structure ##

 - server.js - Main application file
 - routes.js - Api route initialization
 - /node_modules - Dependencies
 - /config
    - default.js - Default configuration
 - /src
    - /collections - ORM Collections
        - orm.js   - ORM initialization
    - /controllers - Api controllers.
    - /services    - Business logic
 - /test - Mocha unit tests
 - /test-run - Mocha integration tests
  

## Configuration ##

Configuration is in `/config/default.json`
```
{
    // application server configuration*
    "server": {
        "port": 1337 // http port app should listen on
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
            "issuer": "skynet.jamestolley.net", 
            "expiresInSeconds": 3600
        }
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

## Testing ##

Unit tests and integration tests are written in mocha. 

Unit tests - run

```
> mocha
```

Integration tests - start the application, then run:

```
> mocha test-run
```