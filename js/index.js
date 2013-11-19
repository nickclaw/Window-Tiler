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
			sub.window = windows.remove(closestWindow)[0];
		}
	}
}

var Drawer = {
	'fillBody': function(layouts) {
		var content = document.getElementById('content');
		for (var i = 0; i < layouts.length; i++) {
			content.appendChild(this.createIcon(layouts[i]));
		}
	},

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
				if (selected.favIconUrl) {
					win.style.backgroundImage = 'url('+selected.favIconUrl+')';
				}
			}

			icon.appendChild(win);
		}

		this.addListener(icon, layout);

		return icon;
	},

	'addListener': function(element, layout) {	
		element.addEventListener('click', function() {
			var layouts = [];
			for (var i = 0, sub = null; sub = layout[i]; i++) {
				var dim = layout[0].window.screen.getWorkspace();

				layouts.push({
					'id':  sub.window.data.id,
					'settings': {
						'left': Math.floor(sub.x * dim.w + dim.x),
						'top': Math.floor(sub.y * dim.h + dim.y),
						'width': Math.floor(sub.w * dim.w),
						'height': Math.floor(sub.h * dim.h),
						'focused': true
					}
				});
			}

			chrome.runtime.sendMessage(
				{	
					'message': 'layout',
					'layouts': layouts
				}
			);

			window.close();		
		});
	},

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
		 	icon = this.createIcon(layout);
		}


		content.appendChild(header);
		content.appendChild(icon);
		content.appendChild(para);
	},

	'error': function(title, message, symbol) {
		this.singleLayout(null, title, message, symbol);
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
				self.screens.push(new Screen(scr));
			}

			chrome.windows.getCurrent({'populate':true}, function(currentWindow) {

				// get all windows
				chrome.windows.getAll({'populate':true}, function(windows) {
					
					// create window objects
					for (var i = 0, win = null; win = windows[i]; i++) {
						console.log(win);
						if (win.state !== 'minimized') {
							var winObject = new Window(win);
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
		if (!self.currentWindow) {
			Drawer.error('whoops', 'It looks like there was an error. Sorry!', 'X');
			return false;
		}

		if (!self.currentScreen && self.screens.length > 1) {
			Drawer.error('whoops', 'Your version of Chrome doesn\'t support multiple screens yet. Sorry!', '!');
			return false;
		}

		if (!self.currentScreen) {
			Drawer.error('whoops', 'This shouldn\'t have happened. Sorry!', '#');
			return false;
		}

		return true;
	}

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
				'message': 'implode',
				'id': currentWindow.data.id,
				'tabs': tabs
			});

			window.close();
		});

		document.getElementById('explode').addEventListener('click', function() {
			chrome.runtime.sendMessage({
				'message': 'explode',
				'tabs': self.currentWindow.data.tabs.map(function(tab) {
					return tab.id;
				})
			});

			window.close();
		});
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
});