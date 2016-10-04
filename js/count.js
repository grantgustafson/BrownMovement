/*
 * Count Class that takes in a JSON file of counts and handles drawing them to the SVG
 * svg: the svg element to add items to
 */
var Count = function(params, svg, apzones) {
    this.svg = svg;
    this.date = params['date'];
    this.pathToData = "data/counts/" + this.date + ".json";
    // console.log(this.pathToData)
    this.apzones = apzones;
 	this.onReadyCallbacks = [];
    var self = this;
    d3.json(this.pathToData, function(error, json) {
	    if (error) return console.warn(error)
	    self.counts = json;
		self.draw(params, self)
	    self.ready();
  	});
};

Count.prototype.ready = function() {
 this.onReadyCallbacks.forEach(function(callback) {
  callback();
 });
};

Count.prototype.onReady = function(func) {
 this.onReadyCallbacks.push(func);
};
/*
 * updates the radii of the counts
 */
Count.prototype.draw = function(params) {
	var starttime;
	var endtime;
	if (params['date'].split("-").length != 3){
		starttime = this.getLengthFromString(params['starttime']);
		endtime = this.getLengthFromString(params['endtime']);
	}else{
		starttime = this.getEpochFromString(params['starttime']);
		endtime = this.getEpochFromString(params['endtime']);
	}
 	var buckets = this.getBuckets(starttime, endtime);
 	var isDrawing = params.isdrawing;
 	var defaultRadius = 15;
	var counts = {};
	var zones = this.apzones.getZones();
	var MAXPOSSIBLERADIUS = 50;
	if (isDrawing){
		defaultRadius = 1;
		for (var i = 0; i < zones.length; i++){
			counts[zones[i]['zone']] = 0;
			for (var j = 0; j < buckets.length; j++){
				if (zones[i]['zone'] in this.counts && buckets[j] in this.counts[zones[i]['zone']]){
					counts[zones[i]['zone']] += this.counts[zones[i]['zone']][buckets[j]];
				}
			}
			counts[zones[i]['zone']] /= buckets.length;
		}
	}
	var maxRadius = 0;
	for (var i = 0; i < zones.length; i++){
		if (counts[zones[i]['zone']] > maxRadius){
			maxRadius = counts[zones[i]['zone']];
		}
	}
	for (var i = 0; i < zones.length; i++){
		counts[zones[i]['zone']] = counts[zones[i]['zone']]/maxRadius*MAXPOSSIBLERADIUS;
	}
	this.apzones.updateZoneRadii(counts, 1000, defaultRadius, maxRadius);
	if (isDrawing){
		document.getElementById("theScale").textContent = "   Maximum Average Density: " + Math.floor(maxRadius) + "   ";
	}else{
		document.getElementById("theScale").textContent = "";
	}
};

/*
 * returns a list of the times the buckets that starttime and endtime fall into start
 */
Count.prototype.getBuckets = function(starttime, endtime){
	var threeToSix = 10800; //seconds in three hours
	var daystart = this.counts['start_time'] + threeToSix;
	var interval = this.counts['interval'];
	// console.log("starttime: " + starttime + " endtime: " + endtime);
	var startbucket = Math.floor(starttime / interval)*interval;
	var endbucket = Math.floor(endtime / interval)*interval;
	// console.log("startbucket: " + startbucket + " endbucket: " + endbucket);
	var buckets = [];
	for (var i = startbucket; i <= endbucket; i += interval){
		buckets.push(i);
	}
	// console.log(buckets)
	return buckets
};

Count.prototype.getEpochFromString = function(timeString) {
	var splitTime = timeString.split(" ");
	var ampm = splitTime[1];
	var hrmin = splitTime[0].split(":");
	var hour = parseInt(hrmin[0]);
	var min = parseInt(hrmin[1]);
	var splitDate = this.date.split("-");
	var year = "20" + String(splitDate[2]);
	var month = String(splitDate[0]);
	var day = String(splitDate[1]);
	if (ampm == "AM" && (hour < 3 || hour == 12)){
		day = String(parseInt(day)+1);
		if (hour == 12){
			hour = 0;
		}
	}
	if (ampm == "PM" && hour != 12){
		hour += 12;
	}
	var d = new Date(year, (month-1), day, hour, min, 0, 0);
	return d.getTime()/1000;
};

Count.prototype.getLengthFromString = function(timeString) {
	// console.log(timeString);
	var splitTime = timeString.split(" ");
	var ampm = splitTime[1];
	var hrmin = splitTime[0].split(":");
	var hour = parseInt(hrmin[0]);
	var min = parseInt(hrmin[1]);
	if (ampm == "AM" && (hour < 3 || hour == 12)){
		if (hour == 12){
			hour = 18;
		}else{
			hour += 18;
		}
	} else if (ampm == "AM"){
		hour -= 6;
	}
	if (ampm == "PM" && hour != 12){
		hour += 6;
	}else if (ampm == "PM" && hour==12){
		hour -=6
	}
	// console.log(hour)
	var length = hour*4 + min*4/60;
	// console.log(length);
	return length;
}