/************* API SHORTCUTS ****************/

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
	chrome.system.display.getInfo(function(screens) {
		screens.each(function(key, value) {
			defineCenter(value);
		});
		callback(screens);
	});
}




/*************** HELPER FUNCTIONS ****************/

function mostlyIn(win, screens) {
	var maxArea = Number.MIN_VALUE;
	var maxScreen = null;

	var ax1 = win.left;
	var ax2 = win.left + win.width;
	var ay1 = win.top;
	var ay2 = win.top + win.height;

	screens.each(function(index, scr) {
		var bx1 = scr.bounds.left;
		var bx2 = scr.bounds.left + scr.bounds.width;
		var by1 = scr.bounds.top;
		var by2 = scr.bounds.top + scr.bounds.height;

		var intersect = Math.max(0, Math.max(ax2, bx2) - Math.min(ax1, bx1)) * // width
						Math.max(0, Math.max(ay2, by2) - Math.min(ay1, by1));  // height


		if (intersect >= maxArea) {
			maxArea = intersect;
			maxScreen = scr;
		}
	});

	return maxScreen;
}

/**
 * places the windows based off the given data
 */
function setWindows(layout, currentScreen) {
	var top = currentScreen.workArea.top;
	var left = currentScreen.workArea.left;
	var width = currentScreen.workArea.width;
	var height = currentScreen.workArea.height;

	layout.each(function(key, value) {
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
 * Pairs the layout windows to browser windows
 */
function pairLayouts(layouts, windows) {
	layouts.each(function(index, layout) {

		var tempWindows = windows.slice(0);

		// define the center of each layout window and
		// pair each layout window to closest browser window
		layout.each(function(i, sub) {
			defineCenter(sub);
			sub.window = tempWindows.remove(getClosest(sub, tempWindows))[0];
		});
	});

	return layouts;
}

/**
 * Creates a basic layout for n amount of screens
 */
 function createBasicLayout(n, windows) {
 	var width = .9;
 	var height = .8;
 	var leftOffset = (1 - width)/Math.max(n - 1, 1);
 	var topOffset = (1 - height)/Math.max(n - 1, 1);

 	var layout  = [];

 	for (var i = 0; i < n; i++) {
 		layout[i] = {
 			'x': leftOffset * i,
 			'y': topOffset * i,
 			'w': width,
 			'h': height
 		};
 		defineCenter(windows[i]);
 	}

 	pairLayouts([layout], windows)

 	return layout;
 }

/**
 * Creates and returns a window icon with proper handling
 */
function createIcon(layout, currentScreen) {
	var calc = function(n, margin) {
		return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
	}

	var element = document.createElement('div');
	element.classList.add('window');

	// for each window position of the layout
	layout.each(function(key, value) {
		// create div
		var sub = document.createElement('div');
		sub.classList.add('sub');

		//set position
		sub.style.left = calc(value.x, 0);
		sub.style.top = calc(value.y, 0);
		sub.style.width = calc(value.w, 6);
		sub.style.height = calc(value.h, 6);

		// set info about selected tab
		var selected = value.window.tabs.filter(function(tab) {
			return tab.selected;
		});

		if (selected) {
			if (selected[0].favIconUrl) {
				sub.style.backgroundImage = 'url('+ selected[0].favIconUrl +')';
			}
			sub.setAttribute('title', selected[0].title);
		}


		// add to window
		element.appendChild(sub);
	});


	element.addEventListener('click', function(event) {
		setWindows(layout, currentScreen);
		window.close();
	});

	return element;
}