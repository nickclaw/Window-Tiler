"use strict";

/**
 * remove and return the given object from the array
 * @param {*} object the object to remove
 */
Array.prototype.remove = function(object) {
	return this.splice(this.indexOf(object), 1);
}

/**
 * finds which screen the window belongs in
 * @param {WindowObject} win the window
 * @param {Array.<ScreenObject>} screens the possible screens
 */
function findScreenForWindow(win, screens) {
	var maxArea = Number.MIN_VALUE;
	var bestFit = null;

	var winDim = win.getBounds();

	for (var i = 0, scr = null; scr = screens[i]; i++) {

		/** @type {Object} */
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

/**
 * singleton for getting/generating/pairing layouts
 * @type {Object}
 * @final
 */
var LayoutManager = {

	/**
	 * gets the valid layouts for 'n' windows
	 * @param {number} n the number of windows
	 * @return {Array.<Array.<Object>>}
	 */
	'getLayouts': function (n) {
		if (options[n]) {
			var layouts = [];
			for (var i = 0; i < options[n].length; i++) {
				var layout = [];
				for (var j = 0; j < options[n][i].length; j++) {
					layout[layout.length] = {
						x : options[n][i][j].x,
						y : options[n][i][j].y,
						h : options[n][i][j].h,
						w : options[n][i][j].w,
						center: {
							x : Math.floor(options[n][i][j].x + options[n][i][j].w / 2),
							y : Math.floor(options[n][i][j].y + options[n][i][j].h / 2)
						}
					}
				}
				layouts[layouts.length] = layout;
			}
			return layouts;
		} else {
			return [LayoutManager.createBasicLayout(n)];
		}
	},

	/**
	 * creates a single layout given any number of windows
	 * @param {number} n the number of windows
	 * @return {Array.<Object>}
	 */
	'createBasicLayout': function (n) {
		var width = .9;
	 	var height = .8;
	 	var leftOffset = (1 - width)/Math.max(n - 1, 1);
	 	var topOffset = (1 - height)/Math.max(n - 1, 1);

	 	var layout = [];

	 	for (var i = 0; i < n; i++) {
	 		layout[i] = {
	 			x: leftOffset * i,
	 			y: topOffset * i,
	 			w: width,
	 			h: height,
	 			center: {
	 				x: leftOffset * i + width/2,
	 				y: topOffset * i + height/2
	 			}
	 		};
	 	}

	 	return layout;
	},

	/**
	 * takes a layout and array of windows, matches each window to the closest layout window
	 *
	 * @param {Array.<Object>} layout
	 * @param {Array.<WindowObject>} wins
	 */
	'pairLayoutToWindows': function (layout, wins) {
		if (layout.length !== wins.length) {
			throw "Number of layout windows and actual windows must be equal.";
		}

		// make a copy
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
			sub.window = windows.remove(closestWindow)[0];
		}
	}
}


/**
 * singleton for outputting html and responding to layout clicks
 * @type {Object}
 * @final
 */
var Drawer = {

	/**
	 * fills the #content box with an icon of each layout
	 * @param {Array.<Array.<Object>>} layouts
	 */
	'fillBody': function(layouts) {
		var content = document.getElementById('content');
		for (var i = 0; i < layouts.length; i++) {
			content.appendChild(Drawer.createIcon(layouts[i]));
		}
	},

	/**
	 * creates the html icon for a layout
	 * @param {Array.<Object>} layout
	 * @return {Element}
	 */
	'createIcon': function(layout) {
		var calc = function(n, margin) {
			return 'calc(' + (n * 100) + '% - ' + margin + 'px )';
		}
		var icon = document.createElement('div');
		icon.classList.add('window');

		for (var i = 0, sub = null; sub = layout[i]; i++) {
			var win = document.createElement('div');
			win.classList.add('sub');

			win.style.left = calc(sub.x, 0);
			win.style.top = calc(sub.y, 0);
			win.style.width = calc(sub.w, 6);
			win.style.height = calc(sub.h, 6);

			var selected = sub.window.getSelectedTab();
			if (selected) {
				win.setAttribute('title', selected.title);
				if (selected.incognito) {
					win.style.backgroundImage = 'url(image/incognito.png)';
				} else if (selected.favIconUrl && selected.favIconUrl.indexOf('chrome://') !== 0) {
					win.style.backgroundImage = 'url('+selected.favIconUrl+')';
				}
			}

			icon.appendChild(win);
		}

		Drawer.addListener(icon, layout);

		return icon;
	},

	/**
	 * adds a click listener to an element, handles sending layout to background.js for window setting
	 * @param {Element} element
	 * @param {Array.<Object>} layout
	 */
	'addListener': function(element, layout) {	
		element.addEventListener('click', function() {
			var layouts = [];
			for (var i = 0, sub = null; sub = layout[i]; i++) {
				var dim = layout[0].window.screen.getWorkspace();

				layouts.push({
					id:  sub.window.data.id,
					settings: {
						left: Math.floor(sub.x * dim.w + dim.x),
						top: Math.floor(sub.y * dim.h + dim.y),
						width: Math.floor(sub.w * dim.w),
						height: Math.floor(sub.h * dim.h),
						focused: true
					}
				});
			}

			chrome.runtime.sendMessage(
				{	
					message : 'layout',
					layouts : layouts
				}
			);

			window.close();		
		}, false);
	},

	/**
	 * creates a single layout setup with an optional message and symbol
	 * @param {Array.<Object>} layout
	 * @param {string} title
	 * @param {string=} message
	 * @param {string=} iconSymbol
	 */
	'singleLayout': function(layout, title, message, iconSymbol) {
		var content = document.getElementById('content');
		content.classList.add('error');

		var header = document.createElement('h2');
		var para = document.createElement('p');
		var icon;

		header.innerHTML = title;
		para.innerHTML = message;


		if (iconSymbol) {
			icon = document.createElement('div');
			icon.classList.add('window');
			icon.innerHTML = iconSymbol;
		} else {
		 	icon = Drawer.createIcon(layout);
		}


		content.appendChild(header);
		content.appendChild(icon);
		content.appendChild(para);
	},

	'error': function(title, message, symbol) {
		Drawer.singleLayout(null, title, message, symbol);
	}
}
	
/**
 * encapsulates the data returned the chrome API representing
 * a window, contains helper functions interact with windows
 *
 * @constructor
 * @param {Object} data
 */
function WindowObject(data) {
	/**
	 * encapsulated data see http://developer.chrome.com/extensions/windows.html
	 * @type {Object}
	 */
	this.data = data;

	/**
	 * the screen this window is on
	 * can be null if chrome is not high enough version
	 * @type {?ScreenObject}
	 */
	this.screen = null;

	/**
	 * returns the windows dimensions
	 * includes left/top offset, width/height, and center coordinates
	 * @return {Object} the bounds of the window
	 */
	this.getBounds = function () {
		return {
			x : this.data.left,
			y : this.data.top,
			w : this.data.width,
			h : this.data.height,
			center : {
				x : Math.floor(this.data.left + this.data.width/2),
				y : Math.floor(this.data.top + this.data.height/2)
			}
		};
	}

	/**
	 * returns the current tab or null if no tab is selected
	 * @return {?Object} the tab information
	 */
	this.getSelectedTab = function () {
		for (var i = 0; i < this.data.tabs.length; i++) {
			if (this.data.tabs[i].selected === true) {
				return this.data.tabs[i];
			}
		}
		return null;
	}
}

/**
 * encapsulates data returned from the Chrome API representing
 * a screen, contains helper functions to interact with windows
 * 
 * @constructor
 * @param {Object} data
 */
function ScreenObject(data) {
	/**
	 * encapsulated data see http://developer.chrome.com/apps/system_display.html
	 * @type {Object}
	 */
	this.data = data;

	/**
	 * an array of WindowObjects that exist in this screen
	 * @type {Array.<WindowObject>}
	 */
	this.windows = [];

	/**
	 * adds a WindowObject to the screens windows property, also sets the windows screen property
	 * @param {WindowObject} win the window to add
	 */
	this.addWindow = function (win) {
		this.windows.push(win);
		win.screen = this;
	}

	/**
	 * gets dimensions of workable screen space
	 * includes left/top offset, width/height, and center coordinates
	 * @return {Object} the bounds of the screen workspace
	 */
	this.getWorkspace = function () {
		return {
			x: this.data.workArea.left,
			y: this.data.workArea.top,
			w: this.data.workArea.width,
			h: this.data.workArea.height,
			center: {
				x: Math.floor(this.data.workArea.left + this.data.workArea.width/2),
				y: Math.floor(this.data.workArea.top + this.data.workArea.height/2)
			}
		};
	}

	/**
	 * gets the dimension of the screens bounds
	 * includes left/top offset, width/height, and center coordinates
	 * @return {Object} the bounds of the screens
	 */
	this.getBounds = function () {
		return {
			x: this.data.bounds.left,
			y: this.data.bounds.top,
			w: this.data.bounds.width,
			h: this.data.bounds.height,
			center: {
				x: Math.floor(this.data.bounds.left + this.data.bounds.width/2),
				y: Math.floor(this.data.bounds.top + this.data.bounds.height/2)
			}
		};
	}
}

/**
 * object in charge of filling popup
 * @constructor
 */
function Manager() {
	var self = this;

	/**
	 * stores all valid windows
	 * @type {Array.<WindowObject>}
	 */
	this.windows = [];

	/**
	 * stores all system screens
	 * @type {Array.<ScreenObject>}
	 */
	this.screens = [];

	/**
	 * the window this popup was opened on
	 * @type {?WindowObject}
	 */
	this.currentWindow = null;

	/**
	 * the screen the current window is a part of
	 * @type {?ScreenObject}
	 */
	this.currentScreen = null;

	/**
	 * an array of possible layouts
	 * @type {Array.<Array.<Object>>}
	 */
	this.layouts = [];

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
				self.screens.push(new ScreenObject(scr));
			}

			chrome.windows.getCurrent({'populate':true}, function(currentWindow) {

				// get all windows
				chrome.windows.getAll({'populate':true}, function(windows) {
					
					// create window objects
					for (var i = 0, win = null; win = windows[i]; i++) {
						console.log(win);
						if (win.state !== 'minimized') {
							var winObject = new WindowObject(win);
							findScreenForWindow(winObject, self.screens);

							// store currently selected windows and screens
							if (winObject.data.id === currentWindow.id) {
								self.currentWindow = winObject;
								self.currentScreen = winObject.screen;
							}

							self.windows.push(winObject);	
						}
					}


					// make sure everything was initialized right
					if ( self.initCheck() ) {

						// register buttons
						self.registerButtons();

						// prepare layouts
						if ( self.prepareLayouts() ) {

							// draw if necessary
							Drawer.fillBody(self.layouts);
						}
					}
				});
			})
		});
	}

	/** 
	 * checks the managers current state to make sure that
	 * everything was initialized correctly, returns false if
	 * there is a problem and displays an appropriate error
	 */
	this.initCheck = function () {

		// if it couldn't find the current window for some reason
		if (!self.currentWindow) {
			Drawer.error('whoops', 'It looks like there was an error. Sorry!', 'X');
			return false;
		}

		// if there are multiple screens and we couldn't find the current window on a screen
		if (!self.currentScreen && self.screens.length > 1) {
			Drawer.error('whoops', 'Your version of Chrome doesn\'t support multiple screens yet. Sorry!', '!');
			return false;
		}

		// has never happened but juuuussst in case....
		if (!self.currentScreen) {
			Drawer.error('whoops', 'This shouldn\'t have happened. Sorry!', '#');
			return false;
		}

		return true;
	}

	/**
	 * gets the toolbar buttons and assigns correct click listeners
	 * handles all toolbar logic too
	 * TODO handle onclick logic elsewhere
	 */
	this.registerButtons = function () {
		document.getElementById('implode').addEventListener('click', function() {
			var currentWindows = self.currentScreen.windows;
			var currentWindow = self.currentWindow;

			console.log('uhoh');

			// get array of all tab ids
			var tabs = [];
			for(var i = 0, win = null; win = currentWindows[i]; i++) {
				if (win.data.id !== currentWindow.data.id) {
					tabs = tabs.concat(win.data.tabs.map(function(tab) {
						return tab.id;
					}));
				}
			}
			chrome.runtime.sendMessage({
				message : 'implode',
				id : currentWindow.data.id,
				tabs : tabs
			});

			window.close();
		}, false);

		document.getElementById('explode').addEventListener('click', function() {
			chrome.runtime.sendMessage({
				message : 'explode',
				tabs: self.currentWindow.data.tabs.map(function(tab) {
					return tab.id;
				})
			});

			window.close();
		}, false);
	}

	/**
	 * Gathers the right layouts, matches them to windows
	 */
	this.prepareLayouts = function () {
		// get layouts

		self.layouts = LayoutManager.getLayouts(self.currentScreen.windows.length);

		// add layouts to windows
		for (var i = 0; i < self.layouts.length; i++) {
			LayoutManager.pairLayoutToWindows(self.layouts[i], self.currentScreen.windows);
		}

		// if there is only one layout / number of windows is unsupported
		if (self.layouts.length === 1) {
			Drawer.singleLayout(self.layouts[0], 'whoops', "We don't fully support " + self.layouts[0].length + " windows yet. Sorry!");
			return false;
		}

		return true;
	}
}

window.addEventListener('DOMContentLoaded', function() {
	new Manager().init();
}, false);
