function handleClick(event) {
	var windows = chrome.windows.getAll(null, arrangeWindows);
}

function arrangeWindows(windows) {
	var width = screen.width;
	var height = screen.availHeight;
	var numWindows = windows.length;
	a = windows;
	for(var i = 0; i < numWindows; i++) {
		chrome.windows.update(windows[i].id, {
			'left': width/2 * i,
			'top': 0,
			'width': width/2,
			'height': height,
			'drawAttention': true,
			'state': 'normal'
		})
	}
}

function calc(n, margin) {
	return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
}

function createIcon(data) {
	var element = document.createElement('div');
	element.classList.add('window');

	for (var i = 0; i < data.length; i++) {
		var sub = document.createElement('div');
		sub.classList.add('sub');
		sub.style.left = calc(data[i].x, 0);
		sub.style.top = calc(data[i].y, 0);
		sub.style.width = calc(data[i].w, 10);
		sub.style.height = calc(data[i].h, 10);
		element.appendChild(sub);
	}

	return element;
}

function setWindows(data) {
	var width = screen.width;
	var height = screen.availHeight;

	chrome.windows.getAll(null, function(windows) {
		console.log(windows, data);
		for (var i = 0; i < windows.length; i++) {
			chrome.windows.update(windows[i].id, {
				'left': Math.floor(width * data[i].x),
				'top': Math.floor(height * data[i].y),
				'width': Math.floor(width * data[i].w),
				'height': Math.floor(height * data[i].h)
			});
		}
	});
}

function setOptions() {
	var windows = chrome.windows.getAll(null, function(windows) {
		var choices = options[windows.length];
		
		for (var i = 0; i < choices.length; i++) {
			var element = createIcon(choices[i]);
			element.addEventListener('click', (function(settings) {
				return function(event) {
					setWindows(settings);
					window.close();
				}
			})(choices[i]));
			document.body.appendChild(element);
		}
	});
}

document.addEventListener('DOMContentLoaded', function () {
	setOptions();

	var buttons = document.querySelectorAll('.window');
	for(var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener('click', handleClick);
	}
});
