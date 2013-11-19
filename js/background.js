chrome.runtime.onMessage.addListener(
	function(request, sender, senderResponse) {

		// layout
		if (request.message === 'layout') {
			for(var i = 0, layout = null; layout = request.layouts[i]; i++) {
				chrome.windows.update(layout.id, layout.settings);
			}
		}

		// explode
		if (request.message === 'explode'){

			for(var i = 1; i < request.tabs.length; i++) {
				chrome.windows.create({
					'tabId': request.tabs[i],
					'type': 'normal',
					'focused': true
				});
			}
		}

		// implode
		if (request.message === 'implode') {

			// move all tabs to new windows
			chrome.tabs.move(request.tabs, {
				'windowId': request.id,
				'index': -1
			});	

			// maximize the one window to make sure it fits nicely in screen
			chrome.windows.update(request.id, {
				'state': 'maximized'
			});
		}
	}
)