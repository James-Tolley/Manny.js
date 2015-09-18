function ServiceError(message) {
	this.name = "ServiceError";
	this.message = (message || "");
}
ServiceError.prototype = Error.prototype;

module.exports = ServiceError;