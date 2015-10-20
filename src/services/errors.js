/**
 * Error for services to through when they encounter a problem with the request.
 * Distinguishes between a bad service request and a general error
 */
function ServiceError(message) {
	this.name = "ServiceError";
	this.message = (message || "");
}
ServiceError.prototype = Object.create(Error.prototype, {
	constructor: {value: ServiceError} 
});

/**
 * Error for when an item is not found
 */
function NotFoundError(message) {
	this.name = "NotFoundError";
	this.message = (message || "Not found");
}
NotFoundError.prototype = Object.create(ServiceError.prototype, {
	constructor: { value: NotFoundError}
});

exports.ServiceError = ServiceError;
exports.NotFoundError = NotFoundError;