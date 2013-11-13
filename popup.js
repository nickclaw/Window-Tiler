/************ SHORT CUTS & PROTOTYPES ***************/
function getWindows(callback) {
	chrome.windows.getAll(null, callback);
}

function updateWindow(window, data) {
	chrome.windows.update(window.id, data);
}

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

/**
 * Creates and returns a window icon with proper handling
 */
function createIcon(data) {
	var calc = function(n, margin) {
		return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
	}

	var element = document.createElement('div');
	element.classList.add('window');

	data.each(function(key, value) {
		var sub = document.createElement('div');
		sub.classList.add('sub');
		sub.style.left = calc(value.x, 0);
		sub.style.top = calc(value.y, 0);
		sub.style.width = calc(value.w, 10);
		sub.style.height = calc(value.h, 10);
		element.appendChild(sub);
	});

	element.addEventListener('click', function(event) {
		setWindows(data);
		window.close();
	});

	return element;
}

/**
 * find the center of an object and sets it as a property of the object
 */
function defineCenter(data) {
	var width = screen.width;
	var height = screen.availHeight;

	var x = data.x === undefined? data.left : data.x * width;
	var y = data.y === undefined? data.top : data.y * height;
	var w = data.w === undefined? data.width : data.w * width;
	var h = data.h === undefined? data.height : data.h * height;

	data.center = {
		'x': x + w/2,
		'y': y + h/2
	}
}

/**
 * returns the distance between two points
 */
function getDistance(a,b) {
	return Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2));
}

/**
 * returns the closest option to the object
 */
function getClosest(object, options) {
	var closestObject = null;
	var closestDistance = Number.MAX_VALUE;

	options.each(function(key, value) {
		var distance = getDistance(object.center, value.center);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestObject = value;
		}
	});
	return closestObject;
}

/**
 * places the windows based off the given data
 */
function setWindows(datas) {
	var width = screen.width;
	var height = screen.availHeight;

	data = [];
	datas.each(function(key, value) {
		defineCenter(value);
		data.push(value);
	});

	getWindows(function(windows) {

		windows.each(function(i, value) {
			defineCenter(value);
			var closest = getClosest(value, data);
			data.remove(closest);
			updateWindow(value, {
				'left': Math.floor(width * closest.x),
				'top': Math.floor(height * closest.y),
				'width': Math.floor(width * closest.w),
				'height': Math.floor(height * closest.h)
			});
		});
	});
}

/**
 * fills the body with the right type of window icons
 */
function fillBody() {
	getWindows(function(windows) {
		options[windows.length].each(function(key, value) {
			document.body.appendChild(createIcon(value));
		});
	});
}

document.addEventListener('DOMContentLoaded', function () {
	fillBody();
});
