/**
 * Server helper tools for integration tests
 */

/*global process*/

var config = require('config'),
	serverOptions = config.get('server');
	
if (serverOptions.useHttps) {
	// Stop supertest rejecting a self signed certificate during testing
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}	
	

/**
 * Determine where the server is running
 */
function getHost(options) {
	var protocol = options.useHttps ? 'https' : 'http';
	var defaultPort = options.useHttps ? 443 : 80;
	
	var port = options.port == defaultPort ? '' : ':' + options.port;
	
	return [protocol, '://localhost', port].join('');			
}	

exports.options = serverOptions;
exports.host = getHost(serverOptions);