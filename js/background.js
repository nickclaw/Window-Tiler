chrome.runtime.onMessage.addListener(
	function(request, sender, senderResponse) {
		console.log(arguments);
		for(var i = 0, layout = null; layout = request.layouts[i]; i++) {
			chrome.windows.update(layout.id, layout.settings);
		}
	}
)