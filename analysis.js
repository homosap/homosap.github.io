// analysis.js
// Analysis of Spiral performance
// Developed by George Marzloff (george@marzloffmedia.com)

function Analysis(_userPath) {

	// The r and theta polar coordinates of the spiral function are linearly related
	// So we can plot this relationship: the angles along the x-axis and r's on the y-axis.
	// Since every change in cursor position should increase the radius in a linear fashion, we can
	// run a regression of (sample #, radius) points to calculate an accuracy score (using R^2).

	this.userPath = _userPath;

	this.truncateInitialPointsBeforeTrueStart = function(data){

		// Since recording starts when the cursor hits the border of the starting circle,
		// the radii start positive and decrease as user moves toward center, creating a dip in the data.
		// we can find the minimum radius point near the start of the path and ignore the data points prior to that.

		var minRadius = 200; // picked a number definitely higher than the radius of the starting circle
		var minElement = {index: 0, radius: minRadius};

		var windowSizeToSearchForMinimum = 100; // will go through data indices 0 to this one.
		if(data.length <= windowSizeToSearchForMinimum){ // make sure the path drawn is longer than the window
			windowSizeToSearchForMinimum = data.length;
		}

		for(var j=0; j < windowSizeToSearchForMinimum; j++){
			if (data[j].radius < minElement.radius){
				minElement = {index: j, radius: data[j].radius}; // overwrites if the radius is lower than the prior min
			}
		}
		data.splice(0, minElement.index-1); // this deletes everything before the minElement index.

		return data;
	};

	this.generateRadiiOnSamplesData = function(path){
		// incoming path is an array of objects of {x,y} points
		var data = [];
		for (var i=0; i<path.length; i++){
			var pt = path[i];
			var radius = Math.sqrt(pt.x*pt.x + pt.y*pt.y);
			data.push({sample: i, radius: radius});
		}
		this.truncateInitialPointsBeforeTrueStart(data);
		// see explanation in method above

		return data;
	};

	this.linearRegression = function(data){
		// Adapted from Trent Richardson's code snippet
		// Credit: http://trentrichardson.com/2010/04/06/compute-linear-regressions-in-javascript/

		var lr = {};
		var n = data.length;
		var sum_x = 0;
		var sum_y = 0;
		var sum_xy = 0;
		var sum_xx = 0;
		var sum_yy = 0;

		for (var i = 0; i < data.length; i++) {
			sum_x  += data[i].sample; // note the +=, it means sum_x = sum_x + data[i].sample.
			sum_y  += data[i].radius;
			sum_xy += (data[i].sample * data[i].radius);
			sum_xx += (data[i].sample * data[i].sample);
			sum_yy += (data[i].radius * data[i].radius);
		}

		lr.slope = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
		lr.intercept = (sum_y - lr.slope * sum_x)/n;
		lr.r2 = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
		lr.fn = function (x) { return this.slope * x + this.intercept; };

		return lr;
	};

	this.radiiData = this.generateRadiiOnSamplesData(this.userPath);
	this.regression = this.linearRegression(this.radiiData);

	this.printResults = function(){
		var delayInMilliseconds = 4000; //1 second


		var accuracyPct = Math.round(this.regression.r2 * 100); // rounds R^2
		setTimeout(function() {
		  //your code to be executed after 1 second
			$('#results').html("Score: " + accuracyPct + "%");
		}, delayInMilliseconds);
		str = "https://api.thingspeak.com/update?api_key=1HH53274QP2486PR&field1="+accuracyPct;
		$.ajax({
        url: str,
        type: 'GET',
        dataType: 'json', // added data type
        success: function(res) {
            console.log(res);
            //alert(res);
        }
    });

		// Output data to CSV in the console with this function
		console.log(this.generateCSV(this.radiiData));
	};

	this.generateCSV = function(data){
		// utility function to output data in CSV format for adding to spreadsheet
		var str = "";
		for(var i=0; i< data.length; i++){
			str += i + ", " + data[i].radius + "\n";
		}
		return str;
	};
}
