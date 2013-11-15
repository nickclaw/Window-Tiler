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
 * retrieves the currentlly selected window, passes it to callback
 */
function getCurrentWindow(callback) {
	chrome.windows.getCurrent({'populate': true}, function(currentWindow) {
		defineCenter(currentWindow);
		callback(currentWindow);
	});
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
 * Creates and returns a window icon with proper handling
 */
function createIcon(layout, currentScreen) {
	var calc = function(n, margin) {
		return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
	}

	var element = document.createElement('div');
	element.classList.add('window');

	layout.each(function(key, value) {
		var sub = document.createElement('div');
		sub.classList.add('sub');
		sub.style.left = calc(value.x, 0);
		sub.style.top = calc(value.y, 0);
		sub.style.width = calc(value.w, 6);
		sub.style.height = calc(value.h, 6);

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
		setWindows(layout, currentScreen);
		window.close();
	});

	return element;
}