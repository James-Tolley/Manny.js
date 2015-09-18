/**
 * Generic error class for services to throw when they encounter bad parameters
 * Default error handler should convert these to BadRequest responses instead of 
 * InternalServerError
 */
function ServiceError(message) {
	this.name = "ServiceError";
	this.message = (message || "");
}
ServiceError.prototype = Error.prototype;

module.exports = ServiceError;