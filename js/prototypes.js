/************** PROTOTYPES ***************/

/**
 * iterate through the array supplying the callback with every index and value
 * optional scope becomes the scope of the callback
 */
Array.prototype.each = function(callback, scope) {
	for (var i = 0; i < this.length; i++) {
		if (callback.call(scope, i, this[i]) === false)
			break;
	}
}

/**
 * remove and return the given object from the array
 */
Array.prototype.remove = function(object) {
	return this.splice(this.indexOf(object), 1);
}

/**
 * iterate through the object supplying the callback with every index and value
 * optional scope becomes the scope of the callback
 */
Object.prototype.each = function(callback, scope) {
	for (key in this) {
		if (this.hasOwnProperty(key)) {
			if (callback.call(scope, key, this[key]) === false)
				break;
		}
	}
}