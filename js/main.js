function Manager(layoutOptions, container) {
	var self = this;

	self.layoutOptions = layoutOptions;
	self.container = container;

	self.currentScreen = null;
	self.currentWindow = null;

	self.fillBody = function() {
		var currentScreen = self.currentScreen;

		if (!currentScreen) {
			self.error("Your version of Chrome does not support multiple screens. Sorry!", "X");
		} else {
			var windows = currentScreen.windows;
			var layouts = self.getLayouts(windows);

			if (layouts.length === 0) {
				self.error("We don't support "+windows.length+" windows yet. Sorry!", "X");
			} else {

				// we have all the variables!!
				// fill container!
				layouts.each(function(index, layout) {
					self.container.appendChild(createIcon(layout, currentScreen));
				});
			}
		}
	}

	self.registerButtons = function() {
		document.getElementById('implode').addEventListener('click', function(event) {
			var currentScreen = self.currentScreen;
			var currentWindow = self.currentWindow;
			var tabs = [];

			// get all tabs
			currentScreen.windows.each(function(index, win) {
				if (!win.focused) {
					tabs = tabs.concat(win.tabs);
				}
			});
				
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
			updateWindow(currentWindow, {
				'state': 'maximized'
			});

			window.close();

		});

		document.getElementById('explode').addEventListener('click', function(event) {
			var currentWindow = self.currentWindow;

			for(var i = 1; i < currentWindow.tabs.length; i++) {
				chrome.windows.create({
					'tabId': currentWindow.tabs[i].id,
					'type': 'normal',
					'focused': true
				});
			}
		});

		document.getElementById('help').addEventListener('click', function() {
			chrome.tabs.create({
				'url': 'info.html',
				'active': true
			});
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

	self.init = function() {
		// get all the computer screens
		getScreens(function(screens) {

			// initialize an array for windows
			screens.each(function(index, scr) {
				scr.windows = [];
			});

			// get all windows
			getWindows(function(windows) {

				// for every window
				windows.each(function(index, win) {

					// find the screen it is in and pair it to the screen
					var inScreen = mostlyIn(win, screens);
					if (win.focused) {
						self.currentWindow = win;
						self.currentScreen = inScreen;
						if (!inScreen) {
							return false;
						}
					}
					inScreen.windows.push(win);
				});

				// do things
				self.fillBody();
				self.registerButtons();
			});
		});
	}

	self.init();
}

window.addEventListener('DOMContentLoaded', function() {
	new Manager(options, document.getElementById('content'));
});