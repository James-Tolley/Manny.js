# Skynet #

Sample application for possible blossoming into the eventual Curious Pastimes plot management app.

Application provides login via username and password which it exchanges for a Json Web Token (jwt). The Api functions all require a valid JWT for access.

### How do I get set up? ###

* Summary of set up
```
> git clone https://JamesTolley@bitbucket.org/JamesTolley/skynet.git
> npm install
> node server.js
```

* Configuration

Configuration is in `/config/default.json`
```
{
        *application server configuration*
	"server": {
		"port": 1337 // http port app should listen on
	},
	"orm": {
		"waterline": {
			"adapters": {
				"memory": "sails-memory"
			},
			"connections": {
				"default": {
					"adapter": "memory"
				}
			}
		}
	},
	"security": {
		"jwt": {
			"secretOrKey": "my-secret-key",
			"issuer": "skynet.jamestolley.net",
			"expiresInSeconds": 3600
		}
	}
}
```

* Dependencies
* Database configuration
* How to run tests

Tests are in mocha. Just run

```
> mocha
```