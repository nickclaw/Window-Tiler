"use strict";

/**
 * remove and return the given object from the array
 */
Array.prototype.remove = function(object) {
	return this.splice(this.indexOf(object), 1);
}

function findScreenForWindow(win, screens) {
	var maxArea = Number.MIN_VALUE;
	var bestFit = null;

	var winDim = win.getBounds();

	for (var i = 0, scr = null; scr = screens[i]; i++) {
		var scrDim = scr.getBounds();
		var intersect = Math.max(0, Math.min(winDim.x + winDim.w, scrDim.x + scrDim.w) - Math.max(winDim.x, scrDim.x)) *
						Math.max(0, Math.min(winDim.y + winDim.h, scrDim.y + scrDim.h) - Math.max(winDim.y, scrDim.y));

		if (intersect > maxArea) {
			maxArea = intersect;
			bestFit = scr;
		}
	}

	if (bestFit) {
		bestFit.addWindow(win);
	}
}

var LayoutManager = {
	'getLayouts': function (n) {
		if (options[n]) {
			var layouts = options[n];
			for (var i = 0; i < layouts.length; i++) {
				for (var j = 0; j < layouts[i].length; j++) {
					layouts[i][j].center = {
						'x': Math.floor(layouts[i][j].x + layouts[i][j].w / 2),
						'y': Math.floor(layouts[i][j].y + layouts[i][j].h / 2)
					};
				}
			}
			return layouts;
		} else {
			return [this.createBasicLayout(n)];
		}
	},

	'createBasicLayout': function (n) {
		var width = .9;
	 	var height = .8;
	 	var leftOffset = (1 - width)/Math.max(n - 1, 1);
	 	var topOffset = (1 - height)/Math.max(n - 1, 1);

	 	var layout = [];

	 	for (var i = 0; i < n; i++) {
	 		layout[i] = {
	 			'x': leftOffset * i,
	 			'y': topOffset * i,
	 			'w': width,
	 			'h': height,
	 			'center': {
	 				'x': leftOffset * i + width/2,
	 				'y': topOffset * i + height/2
	 			}
	 		};
	 	}

	 	return layout;
	},

	'pairLayoutToWindows': function (layout, wins) {
		if (layout.length !== wins.length) {
			throw "Number of layout windows and actual windows must be equal.";
		}

		var windows = wins.slice(0);

		// for every layout
		for(var i = 0, sub = null; sub = layout[i]; i++) {
			var minDistance = Number.MAX_VALUE;
			var closestWindow = null;

			for(var j = 0, win = null; win = windows[j]; j++) {
				var scrDim = win.screen.getWorkspace();
				var winDim = win.getBounds();
				var distance = Math.sqrt(
					Math.pow(sub.center.x * scrDim.w - winDim.center.x , 2) +
					Math.pow(sub.center.y * scrDim.h - winDim.center.y , 2)
				);

				if (distance < minDistance) {
					minDistance = distance;
					closestWindow = win;
				}
			}
			sub.window = windows.remove(closestWindow);
		}
	}
}

function Window(data) {
	this.data = data;
	this.screen = null;

	this.set = function(i) {
		var dim = this.layouts[i];
		var screenDim = this.screen.getWorkspace();

		chrome.windows.update(this.data.id, {
			'left': Math.floor(screenDim.w * dim.x) + screenDim.x,
			'top': Math.floor(screenDim.h * dim.y) + screenDim.y,
			'width': Math.floor(screenDim.w * dim.w),
			'height': Math.floor(screenDim.h * dim.h),
			'focused': true
		});
	}

	this.getBounds = function () {
		return {
			'x': this.data.left,
			'y': this.data.top,
			'w': this.data.width,
			'h': this.data.height,
			'center': {
				'x': Math.floor(this.data.left + this.data.width/2),
				'y': Math.floor(this.data.top + this.data.height/2)
			}
		};
	}

	this.isSelected = function () {
		return this.data.focused;
	}

	this.getSelectedTab = function () {
		for (var i = 0; i < this.data.tabs.length; i++) {
			if (this.data.tabs[i].selected === true) {
				return this.data.tabs[i];
			}
		}
		return null;
	}
}

function Screen(data) {
	this.data = data;
	this.windows = [];

	this.addWindow = function (win) {
		this.windows.push(win);
		win.screen = this;
	}

	this.getWorkspace = function () {
		return {
			'x': this.data.workArea.left,
			'y': this.data.workArea.top,
			'w': this.data.workArea.width,
			'h': this.data.workArea.height,
			'center': {
				'x': Math.floor(this.data.workArea.left + this.data.workArea.width/2),
				'y': Math.floor(this.data.workArea.top + this.data.workArea.height/2)
			}
		};
	}

	this.getBounds = function () {
		return {
			'x': this.data.bounds.left,
			'y': this.data.bounds.top,
			'w': this.data.bounds.width,
			'h': this.data.bounds.height,
			'center': {
				'x': Math.floor(this.data.bounds.left + this.data.bounds.width/2),
				'y': Math.floor(this.data.bounds.top + this.data.bounds.height/2)
			}
		};
	}
}

function Manager() {
	var self = this;
	this.windows = [];
	this.screens = [];
	this.currentWindow = null;
	this.currentScreen = null;

	/** 
	 * Query the system for information about windows and
	 * screens. Encapsulates that information in appropriate
	 * objects.
	 */
	this.init = function () {

		// get all screens
		chrome.system.display.getInfo(function(screens) {

			// create screen objects
			for (var i = 0, scr = null; scr = screens[i]; i++) {
				self.screens.push(new Screen(scr));
			}


			// get all windows
			chrome.windows.getAll({'populate':true}, function(windows) {
				
				// create window objects
				for (var i = 0, win = null; win = windows[i]; i++) {
					if (win.status !== 'minimized') {
						var winObject = new Window(win);
						findScreenForWindow(winObject, self.screens);

						// store currently selected windows and screens
						if (winObject.isSelected()) {
							self.currentWindow = winObject;
							self.currentScreen = winObject.screen;
						}

						self.windows.push(winObject);	
					}
				}

				// make sure everything looks good then
				// prepare the layouts and make sure they are good
				if ( self.initCheck() && self.prepareLayouts() ) {

					// display layouts
					var container = document.getElementById('content');
					var calc = function(n, margin) {
						return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
					}

					// for each layout
					// for (var i = 0; i < self.currentScreen.windows[0].layouts.length; i++) {
					// 	var icon = document.createElement('div');
					// 	icon.classList.add('window');

					// 	// go through each window and grab the right sublayout
					// 	for (var j = 0, win = null; win = self.currentScreen.windows[j]; j++) {
					// 		var sub = document.createElement('div');
					// 		sub.classList.add('sub');
					// 		var value = win.layouts[i];

					// 		sub.style.left = calc(value.x, 0);
					// 		sub.style.top = calc(value.y, 0);
					// 		sub.style.width = calc(value.w, 6);
					// 		sub.style.height = calc(value.h, 6);

					// 		var selected = win.getSelectedTab();
					// 		if (selected) {
					// 			sub.setAttribute('title', selected.title);
					// 			if (selected.favIconUrl) {
					// 				sub.style.backgroundImage = 'url('+selected.favIconUrl+')';
					// 			}
					// 		}

					// 		icon.appendChild(sub);
					// 	}

					// 	icon.addEventListener('click', function(event) {

					// 		window.close();
					// 	});

					// 	container.appendChild(icon);
					// }
				}
			});
		});
	}

	/** 
	 * checks the managers current state to make sure that
	 * everything was initialized correctly, returns false if
	 * there is a problem and displays an appropriate error
	 */
	this.initCheck = function () {
		return true;
	}

	/**
	 * Gathers the right layouts, matches them to windows
	 */
	this.prepareLayouts = function () {
		// get layouts
		var layouts = LayoutManager.getLayouts(self.currentScreen.windows.length);

		// add layouts to windows
		for (var i = 0; i < layouts.length; i++) {
			LayoutManager.pairLayoutToWindows(layouts[i], self.currentScreen.windows);
		}

		// if there is only one layout / number of windows is unsupported
		if (layouts.length === 1) {

			// return false;
		}

		return true;
	}
}

window.addEventListener('DOMContentLoaded', function() {
	var manager = new Manager();
	manager.init();
	document.getElementById('implode').addEventListener('click', function() {
		var currentScreen = manager.currentScreen;
		var currentWindow = manager.currentWindow;
		var tabs = [];

		// get all tabs
		for (var i = 0, win = null; win = currentScreen.windows[i]; i++) {
			if (win !== currentWindow) {
				tabs = tabs.concat(win.tabs);
			}
		}
			
		// create array of tab ids
		var tabIds = tabs.map(function(tab) {
			return tab.id;
		});	

		// move all tabs to new windows
		chrome.tabs.move(tabIds, {
			'windowId': currentWindow.id,
			'index': -1
		});	

		// maximize the one window to make sure it fits nicely in screen
		chrome.windows.update(currentWindow.id, {
			'state': 'maximized'
		});

		window.close();
	});
	document.getElementById('explode').addEventListener('click', function() {

	});

	document.getElementById('help').addEventListener('click', function() {

	});
});