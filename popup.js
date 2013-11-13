/************ SHORT CUTS & PROTOTYPES ***************/
function getWindows(callback) {
	chrome.windows.getAll({'populate': true}, callback);
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
		var selected = null;
		for (var i = 0; i < value.window.tabs.length; i++) {
			if (value.window.tabs[i].selected) {
				selected = value.window.tabs[i];
				break;
			}
		}

		var sub = document.createElement('div');
		sub.classList.add('sub');
		sub.style.left = calc(value.x, 0);
		sub.style.top = calc(value.y, 0);
		sub.style.width = calc(value.w, 10);
		sub.style.height = calc(value.h, 10);
		
		if (selected) {
			sub.style.backgroundImage = 'url('+ (selected.favIconUrl?selected.favIconUrl:'favicon.png')+')';
			sub.setAttribute('title', selected.title);
		} else {
			sub.style.backgroundImage = 'url(favicon.png)';
		}

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

	datas.each(function(key, value) {
		updateWindow(value.window, {
			'left': Math.floor(width * value.x),
			'top': Math.floor(height * value.y) + (value.y?23:0),
			'width': Math.floor(width * value.w),
			'height': Math.floor(height * value.h)
		})
	});
}

/**
 * fills the body with the right type of window icons
 */
function fillBody() {
	getWindows(function(windows) {

		// make sure each window has it's center point defined
		windows.each(function(key,value) {
			defineCenter(value);
		});

		// for each window layout
		options[windows.length].each(function(key, value) {

			// make a copy so we can remove used ones per icon
			tempWindows = windows.slice(0);

			// for every sub window of a layout TODO: .each?
			for (var i = 0; i < value.length; i++) {
				
				// get closest window to center position and save it
				defineCenter(value[i]);
				var closest = getClosest(value[i], tempWindows);
				tempWindows.remove(closest);
				value[i].window = closest;
			}

			// add icon to body
			document.body.appendChild(createIcon(value));
		});
	});
}

document.addEventListener('DOMContentLoaded', function () {
	fillBody();
});
