// canvas.js
// This javascript is used to manage the cursor tracer canvas
// Developed by George Marzloff (george@marzloffmedia.com)

$( document ).ready(function() {

  	var spiral = new Spiral({				// we create a Spiral object here.
		startPoint: {x: 400, y: 210},		// See Spiral() object in spiral.js
		numberOfLoops: 3.15,
		radiusGrowthRate: 0.15,
	}); 		

	var hoverTargetsRadius = 15;
	var pathPoints = [];					// stores the path of the mouse
	var isTracking = false;					// flag to turn on/off tracking (i.e. path drawing code. Leap tracking is always on)

	var radiusPlotForAnalysis = [];			// create an array to store the sample #, radius plot for analysis later

	addUserPathLayer();						// Run a function to setup an empty layer for userPath without any points yet.
											// look for function addUserPathLayer() below to see the instructions

	// CREATE LAYER FOR SPIRAL GUIDELINE
	$('canvas').drawLine({
		strokeWidth: 3,
		strokeStyle: '#aaa', // gray
		visible: true,
		name: 'guideline',
		layer: true
	});

	// ADD THE SPIRAL GUIDELINE POINTS TO THE LAYER AND DRAW IT
	$('canvas').setLayer('guideline', spiral.guidelinePoints)
	.drawLayers();

	// Draw the starting circle on the canvas using drawArc method
	$('canvas').drawArc({
	  fillStyle: '#0a0', // green
	  opacity: 0.75,
	  x: spiral.startPoint.x,
	  y: spiral.startPoint.y,
	  radius: hoverTargetsRadius,
	  layer: true,
	  name: 'startCircle'
	  // Notice! mouseover and mouseout functions are removed
	});

	// DRAW THE TARGET CIRCLE
	$('canvas').drawArc({
	  fillStyle: '#00d', // green
	  opacity: 0.75,
	  x: spiral.endPoint.x, y: spiral.endPoint.y,
	  radius: hoverTargetsRadius,
	  layer: true,
	  name: 'targetCircle'
	  // Notice! mouseover and mouseout functions are removed
	});

	// DRAW INSTRUCTIONS TEXT
	$('canvas').drawText({
	  fillStyle: '#000',
	  x: 400, y: 20,
	  fontSize: 14,
	  fontFamily: 'Verdana, sans-serif',
	  text: '',
	  layer: true,
	  name: 'instructionsText'
	});

	// DRAW RESET BUTTON
	$('canvas').drawRect({
		fillStyle: '#f00',
		x: 60, y: 350,
		width: 50, height: 40,
		layer: true,
		name: 'resetButton',
		cornerRadius: 10,
		click: function(){
			resetPath();
		}
	});

	// DRAW TEXT ON RESET BUTTON
	$('canvas').drawText({
		fillStyle: '#fff',
		x: $('canvas').getLayer('resetButton').x,
		y: $('canvas').getLayer('resetButton').y,
		width: 50,
		height: 40,
		text: 'Reset',
		layer: true,
		name: 'resetText',
		intangible: true
	});

	// LEAP MOTION TEXT POSITION
	$('canvas').drawText({
	  fillStyle: '#000',
	  x: 100, y: 20,
	  fontSize: 14,
	  fontFamily: 'Verdana, sans-serif',
	  text: "Leap",
	  layer: true,
	  name: 'leapxy'
	});

	// CREATE A PURPLE CIRCLE LAYER TO SEE THE FINGER POSITION
	$('canvas').drawArc({
	  fillStyle: '#c0f',
	  radius: 10,
	  layer: true,
	  name: 'leapCursor',
	  visible: false,
	});

	function addUserPathLayer(){
		$('canvas').addLayer({
			name: 'userPath',
			type: 'line',
			strokeStyle: '#f00',
			strokeWidth: 3,
			index: 4
		});
	}

	function resetPath(){
		// clear the points array, delete userPath and add a blank userPath layer
	  	pathPoints = [];
	  	radiusPlotForAnalysis = [];
	  	isTracking = false;
	  	$('canvas').removeLayer('userPath');
	  	$('#results').html("");
	  	addUserPathLayer();
	  	$('canvas').drawLayers();
	}

	//////////////////////////////////////////////////////
	// SETUP AND OBTAIN DATA FROM LEAP MOTION
	//////////////////////////////////////////////////////

	Leap.loop({}, function(frame) {
		// All the data we need is passed to the object called frame, for every capture frame.

        if(frame.pointables.length > 0){
        	// There is at least one pointable (finger or any stick tool) object in the field, so get to work!

        	// Take the first pointable currently in the frame and normalize the tip position
	        var pointable = frame.pointables[0];
	        var interactionBox = frame.interactionBox;
	        var normalizedPosition = interactionBox.normalizePoint(pointable.tipPosition, true);

	        // Convert the normalized coordinates to span the canvas
	        var pointerOnCanvas = {x: $('canvas').width() * normalizedPosition[0],
	        					   y: $('canvas').height() * (1 - normalizedPosition[1])};
	        // we can ignore z for a 2D context

	       	var leapCursorLayer = $('canvas').getLayer('leapCursor');

	        // if the fingertip moved since last frame, check if it collides with the startCircle layer
	        // a != b means 'a does not equal b'. || means OR, and && means AND.
	        if(	((Math.round(pointerOnCanvas.x) != Math.round(leapCursorLayer.x)) ||
	        	(Math.round(pointerOnCanvas.y) != Math.round(leapCursorLayer.y))) &&
	        	isTracking == false) {

	        	// the x's or y's do not match, so enter this block.
	        	// check if the cursor position is colliding with the start circle using a custom method
	        	// collisionTest() returns true or false and that value is assigned to isTracking.
	        	isTracking = collisionTest(leapCursorLayer, $('canvas').getLayer('startCircle'));

	        }else if(isTracking == true && collisionTest(leapCursorLayer, $('canvas').getLayer('targetCircle')) == true){
	        	// else if the user already is drawing a path and has hit the targetCircle,
	        	// turn off tracking and analyze
	        	isTracking = false;
		   			var analysis = new Analysis(radiusPlotForAnalysis);
		   			analysis.printResults();
	        }

	        // Update the text box layer with the fingertip's current coordinates
	        $('canvas').setLayer('leapxy',{text: '(' + pointerOnCanvas.x.toFixed() + ', ' + pointerOnCanvas.y.toFixed() + ')' });
	        leapCursorLayer.x = pointerOnCanvas.x;
	        leapCursorLayer.y = pointerOnCanvas.y;
	        leapCursorLayer.visible = true;

	        if(isTracking == true){
						// Create a path following the leapCursorLayer
						// by adding an array of the x,y coordinates as an element in the pathPoints array
						// this creates a "nested" or "multidimensional" array
						pathPoints.push([pointerOnCanvas.x, pointerOnCanvas.y]);

						var i = pathPoints.length;	// use this # to create the property name e.g. x1, x2, x3, etc
						var pathLayer = $('canvas').getLayer('userPath');
						pathLayer['x'+i] = pathPoints[i-1][0];
						pathLayer['y'+i] = pathPoints[i-1][1];

						// Here we store the x,y point as if we moved the spiral center to the canvas origin (0,0)
						// Then we get the magnitude of the (x,y) vector (i.e. radius) without any translational
						// corrections in the Analysis methods
						radiusPlotForAnalysis.push({x: pathPoints[i-1][0] - spiral.startPoint.x,
												  	y: pathPoints[i-1][1] - spiral.startPoint.y});
					}

	        $('canvas').drawLayers();

	    }else{
	    	$('canvas').setLayer('leapxy',{text: 'No Finger!' });	// turn off coordinates' text output
	    	$('canvas').setLayer('leapCursor',{visible:false})
	    	.drawLayers();
	    }

	});

	function collisionTest(obj1,obj2){
		// This function tests if the distance between the centers of two round layers
		// is less than the sum of their radii. If so, there is a collision.
		// assumes obj1 and obj2 are type: arc layers
		var sumOfRadii = obj1.radius + obj2.radius;
		var diffInX = obj2.x - obj1.x;
		var diffInY = obj2.y - obj1.y;
		var vectorMagnitude = Math.sqrt(diffInX*diffInX + diffInY*diffInY);

		return vectorMagnitude < sumOfRadii;
	}

});
