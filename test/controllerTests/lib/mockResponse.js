var Promise = require('bluebird');

/**
 * Returns a mock response object that behaves like a promise
 * and resolves when json or send is called. 
 */
function mockResponse() {
	var resolve, reject;
	var promise = new Promise(function(){
		resolve = arguments[0];
		reject = arguments[1];
	});
	
	promise.json = function(errOrObj, obj) {
			if (obj) {
				return resolve({ 
					status: errOrObj,
					body: obj
				});
			}
			
			return resolve({
				status: 200,
				body: errOrObj
			});
		}
		
	promise.send = promise.json;
		
	return promise;
}

module.exports = mockResponse;