// spiral.js 
// Spiral object creation
// Developed by George Marzloff (george@marzloffmedia.com)

function Spiral(params) {

	// Creates an Archimedes Spiral
	// where r(theta) = speed * theta

	this.startPoint = params.startPoint;				// center point of the spiral on the canvas
	this.numberOfLoops = params.numberOfLoops;			// # of 360 degree turns to draw
	this.radiusGrowthRate = params.radiusGrowthRate;	// how fast the spiral moves away from its center

	this.xyForPolar = function(coords){					// converts cartesian points to polar points
		// standard polar to cartesian points conversion
		// takes radians
		return {x: Math.round(coords.r * Math.cos(coords.angle)), 
				y: Math.round(coords.r * Math.sin(coords.angle))};
	};

	this.generateEndPoint = function(){					// calculate the last point of the spiral
		var point = this.xyForPolar(
			{r: this.radiusGrowthRate * this.numberOfLoops * 360,
			angle: this.numberOfLoops * 2 * Math.PI});

		return {x: point.x + this.startPoint.x, 
				y: point.y + this.startPoint.y}; // includes the offset of where the spiral starts
	};

	this.generateGuidelinePoints = function(){			// run through equation and store x,y points
		var allPoints = {}; // creates data object
		
		var maxAngleInDegrees = this.numberOfLoops * 360;

		// The basic spiral function is r(theta) = radiusGrowthRate * theta
		for(var currentDegrees = 0; currentDegrees <= maxAngleInDegrees; currentDegrees++){

			var currInRadians = currentDegrees * Math.PI / 180.0;
			var point = this.xyForPolar({r: this.radiusGrowthRate * currentDegrees,
										angle: currInRadians});
			allPoints['x'+(currentDegrees+1)] = point.x + this.startPoint.x;
			allPoints['y'+(currentDegrees+1)] = point.y + this.startPoint.y;
		}
		return allPoints;
	};

	this.endPoint = this.generateEndPoint();				 // store the endPoint
	this.guidelinePoints = this.generateGuidelinePoints();	// store the guidelinePoints
}