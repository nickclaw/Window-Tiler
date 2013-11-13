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
Object.prototype.each = function(callback, context) {
	for (key in this) {
		if (this.hasOwnProperty(key)) {
			callback.call(context, key, this[key]);
		}
	}
}



function calc(n, margin) {
	return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
}

function createIcon(data) {
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

function setWindows(data) {
	var width = screen.width;
	var height = screen.availHeight;

	getWindows(function(windows) {
		windows.each(function(i, value) {
			updateWindow(value, {
				'left': Math.floor(width * data[i].x),
				'top': Math.floor(height * data[i].y),
				'width': Math.floor(width * data[i].w),
				'height': Math.floor(height * data[i].h)
			});
		});
	});
}

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
