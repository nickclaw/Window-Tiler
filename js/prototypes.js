/************** PROTOTYPES ***************/
Array.prototype.each = function(callback, context) {
	for (var i = 0; i < this.length; i++) {
		callback.call(context, i, this[i]);
	}
}
Array.prototype.remove = function(object) {
	return this.splice(this.indexOf(object), 1);
}
Object.prototype.each = function(callback, context) {
	for (key in this) {
		if (this.hasOwnProperty(key)) {
			callback.call(context, key, this[key]);
		}
	}
}