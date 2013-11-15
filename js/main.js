function Manager(layoutOptions, container) {
	var self = this;

	self.layoutOptions = layoutOptions;
	self.container = container;

	self.currentWindow = null;
	self.windows = null;
	self.screens = null;

	self.init = function() {
		if (self.currentWindow && self.windows && self.screens) {
			var currentScreen, currentWindows, layouts;

			// get each variable, print error if it can't
			if        ( !(currentScreen = self.getCurrentScreen()) ) {
				self.error("We can't tell which screen this window is on. <a href=\"\">Learn more?</a>", "X");
			} else if ( (currentWindows = self.getScreenWindows(currentScreen)).length === 0 ) {
				self.error("We can't find any windows on this screen. <a href=\"\">Learn more?</a>", "O");
			} else if ( (layouts = self.getLayouts(currentWindows, currentScreen)).length === 0 ) {
				self.error("We don't support "+currentWindows.length+" windows yet. Sorry!", "?");
			} else {

				// we have all the variables!!
				// fill container!
				layouts.each(function(index, layout) {
					self.container.appendChild(createIcon(layout, currentScreen));
				});
			}
		}
	}

	self.getCurrentScreen = function() {

		// shortcut if there is only one screen
		if (self.screens.length === 1) {
			return self.screens[0];
		}

		// otherwise check all the screens
		// TODO figure out a way to return from closure
		var currentScreen = null;
		self.screens.each(function(key, scr) {
			if (inBounds(self.currentWindow.center, scr.bounds)) {
				currentScreen = scr;
				return false;
			}
		});

		return currentScreen;
	}

	self.getScreenWindows = function(currentScreen) {

		// shortcut if there is only one screen
		// return all screens not minimized
		if (self.screens.length === 1) {
			return self.windows.filter(function(win) {
				return win.state !== 'minimized';
			});
		}

		// otherwise check all windows
		return self.windows.filter(function(win) {
			return inBounds(win.center, currentScreen.bounds) && win.state !== 'minimized';
		});
	}

	self.getLayouts = function(windows) {
		var layouts = self.layoutOptions[windows.length];

		// if not undefined
		if (layouts) {
			layouts.each(function(index, layout) {

				var tempWindows = windows.slice(0);

				// define the center of each layout window and
				// pair each layout window to closest browser window
				layout.each(function(i, sub) {
					defineCenter(sub);
					sub.window = tempWindows.remove(getClosest(sub, tempWindows))[0];
				});
			});
		}
		
		// at the very least return an array
		return layouts?layouts:[];
	}

	self.error = function(message, symbol) {
		self.container.classList.add('error');
		self.container.innerHTML = '<h2>whoops</h2><div class="window">'+symbol+'</div><p>'+message+'</p>';
	}



	// get all values, init() only works when all are defined
	getScreens(function(screens) {
		self.screens = screens;
		self.init();
	})
	getCurrentWindow(function(currentWindow) {
		self.currentWindow = currentWindow;
		self.init();
	});
	getWindows(function(windows) {
		self.windows = windows;
		self.init();
	});
}

window.addEventListener('DOMContentLoaded', function() {
	new Manager(options, document.getElementById('content'));
});