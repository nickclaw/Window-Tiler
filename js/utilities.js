/***************** UTILITIES ******************/

/**
 * returns true if the point is within the bounds
 */
function inBounds(point, bounds) {
	return 	( (point.x > bounds.left) && (point.x < bounds.left + bounds.width ) ) && 	// horizontal
			( (point.y > bounds.top ) && (point.y < bounds.top  + bounds.height) );		// vertical
}

/**
 * find the center of an object and sets it as a property of the object
 */
function defineCenter(data) {
	var width = screen.width;
	var height = screen.availHeight;

	var x = data.x === undefined? data.left : data.x * width;
	var y = data.y === undefined? data.top : data.y * height;
	var w = data.w === undefined? data.width : data.w * width;
	var h = data.h === undefined? data.height : data.h * height;

	data.center = {
		'x': x + w/2,
		'y': y + h/2
	}
}

/**
 * returns the distance between two points
 */
function getDistance(a,b) {
	return Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2));
}