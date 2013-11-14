/************** SHORTCUTS ***************/
/**
 * retrieves all the windows, passes them to callback
 */
function getWindows(callback) {
	chrome.windows.getAll({'populate': true}, function(windows) {
		windows.each(function(key, value) {
			defineCenter(value);
		});
		callback(windows);
	});
}
/** 
 * updates a window
 */
function updateWindow(window, data) {
	chrome.windows.update(window.id, data);
}

/**
 * retrieves all screens, passes them to callback
 */
function getScreens(callback) {
	chrome.system.display.getInfo(callback);
}

/** 
 * retrieves the currentlly selected window, passes it to callback
 */
function getCurrentWindow(callback) {
	chrome.windows.getCurrent({'populate': true}, function(currentWindow) {
		defineCenter(currentWindow);
		callback(currentWindow);
	});
}

/**
 * finds the screen holding targetWindow, passes it to callback
 */
function getScreen(targetWindow, callback) {
	getScreens(function(screens) {
		var currentScreen = null;
		screens.each(function(key, value) {
			if (inBounds(targetWindow.center, value.bounds)) {
				currentScreen = value;
			}
		});
		callback(currentScreen);
	});
}

/**
 * finds the windows that belong in a screen, passes them to a callback
 */
function getScreenWindows(screen, callback) {
	getWindows(function(windows) {
		screenWindows = [];
		windows.each(function(key, value) {
			if (inBounds(value.center, screen.bounds)) {
				screenWindows.push(value);
			}
		});
		callback(screenWindows);
	});
}

/**
 * finds the windows that are in the current screen, passes them to a callback
 */
function getCurrentWindows(callback) {
	getCurrentWindow(function(win){
	    getScreen(win, function(scr){
	        getScreenWindows(scr, function(windows) {
	        	callback(windows);
	        }); 
	    });
	});
}

/** 
 * returns the tab with focus in a window
 */
function getSelectedTab(targetWindow) {
	var selected = targetWindow.tabs.filter(function(tab) {
		return tab.selected;
	});
	if (selected.length > 0) {
		return selected[0];
	} else {
		return null;
	}
}

/**
 * returns the closest option to the object, all objects/options must have center
 * object = object
 * options = array
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






/****************** OTHER FUNCTIONS ******************/

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

		var selected = getSelectedTab(value.window);

		if (selected) {
			if (selected.favIconUrl) {
				sub.style.backgroundImage = 'url('+ selected.favIconUrl +')';
			}
			sub.setAttribute('title', selected.title);
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
 * places the windows based off the given data
 */
function setWindows(data) {
	var top = screen.availTop;
	var left = screen.availLeft;
	var width = screen.availWidth;
	var height = screen.availHeight;

	data.each(function(key, value) {
		updateWindow(value.window, {
			'left': Math.floor(width * value.x) + left,
			'top': Math.floor(height * value.y) + top,
			'width': Math.floor(width * value.w),
			'height': Math.floor(height * value.h),
			'focused': true,
		})
	});
}

/**
 * fills the body with the right type of window icons
 */
function fillBody() {
	var box = document.getElementById('content');

	// get all windows on the current screen
	getCurrentWindows(function(windows) {

		// for each window layout
		options[windows.length].each(function(index, layoutOptions) {

			// make a copy so we can remove used ones for every icon
			tempWindows = windows.slice(0);

			// for every sub window of a layout TODO: .each?
			for (var i = 0; i < layoutOptions.length; i++) {
				
				// get closest window to center position and save it
				defineCenter(layoutOptions[i]);
				var closest = getClosest(layoutOptions[i], tempWindows);
				tempWindows.remove(closest);
				layoutOptions[i].window = closest;
			}

			// add icon to body
			box.appendChild(createIcon(layoutOptions));
		});
	});
}

// init
document.addEventListener('DOMContentLoaded', function () {
	fillBody();
});
