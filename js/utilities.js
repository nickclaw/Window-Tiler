/***************** UTILITIES ******************/

/**
 * returns true if the point is within the bounds
 * point must have x and y properties, bounds must have top, left, width, and height
 */
function inBounds(point, bounds) {
	return 	( (point.x > bounds.left) && (point.x < bounds.left + bounds.width ) ) && 	// horizontal
			( (point.y > bounds.top ) && (point.y < bounds.top  + bounds.height) );		// vertical
}

/**
 * find the center of an object and sets it as a property of the object
 * object must have a defined left/x, top/y, width/w, and height/h
 */
function defineCenter(object) {
	var width = screen.width;
	var height = screen.availHeight;

	var x = object.x === undefined? object.left : object.x * width;
	var y = object.y === undefined? object.top : object.y * height;
	var w = object.w === undefined? object.width : object.w * width;
	var h = object.h === undefined? object.height : object.h * height;

	object.center = {
		'x': x + w/2,
		'y': y + h/2
	}
}

/**
 * returns the distance between two points
 * points must have x and y properties
 */
function getDistance(a,b) {
	return Math.sqrt(Math.pow(a.x - b.x,2) + Math.pow(a.y - b.y,2));
}