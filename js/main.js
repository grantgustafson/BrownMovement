var botLat = 41.822789;
var leftLng = -71.406602;
var topLat = 41.832495;
var rightLng = -71.396293;

var worldWidth = Math.abs(rightLng-leftLng);
var worldHeight = Math.abs(topLat-botLat);
var mapDisplayOpts = {grass: true, footways: true,  streets: true, bldgs: true}

var screenWidth = Math.min($(window).width(), $(document).width());
var screenHeight = Math.min($(window).height(), $(document).height());

var svg = undefined
var projection = undefined

var tooltip;

var isCount = true;
var isFlux = false;
var isPrediction = false;
var selectByDate = false;
var currDataName;
var currDate = "11-12-15";
var map = {};
var APById = {};
var APs = [];
var dateText;
var timeText;
var startTime = "6:00 AM";
var endTime = "2:00 AM";
var weatherName = "2015-11-12";
var weatherData = {};
var maxRadius = 0;
var params;
//Nov 12 -> March 8
var count;
var aps;
var map;
var flux;

var weekday = "Tuesday";


var changeWeather = function(){
	$("#sunny")[0].style.visibility = "hidden";
	$("#cloudy")[0].style.visibility  = "hidden";
	$("#snowy")[0].style.visibility  = "hidden";
	$("#partly-cloudy")[0].style.visibility  = "hidden";
	$("#rainy")[0].style.visibility  = "hidden";
	$("#stormy")[0].style.visibility  = "hidden";

	var currWeather = weatherData[weatherName];

	$("#"+currWeather)[0].style.visibility  = "visible";

	var split = weatherName.split("-");
	var d = new Date(split[0], split[1], split[2], 12, 0, 0, 0);
	switch (d.getUTCDay()){
		case 0:
			weekday = "Sunday";
			break;
		case 1:
			weekday = "Monday";
			break;
		case 2:
			weekday = "Tuesday";
			break;
		case 3:
			weekday = "Wednesday";
			break;
		case 4:
			weekday = "Thursday";
			break;
		case 5:
			weekday = "Friday";
			break;
		case 6:
			weekday = "Saturday";
			break;
	}
	document.getElementById("weekday").textContent = weekday;
}

var init = function() {
	var s = .75 * 7000000,
	t = [screenWidth / 2, screenHeight / 2];

	timeText = document.getElementById("timeRange");
	timeText.textContent = startTime + " - " + endTime;

	toggleSelect();

	projection = d3.geo.transverseMercator();

	projection
	.scale(s)
	.translate(t)
	.rotate([71 + 24.106/60, -41 - 49.66/60, -5]);

	tooltip = d3.select("body")
				.append("div")
				.style("position", "absolute")
				.style("z-index", "10")
				.style("visibility", "hidden")
				.style("line-height", "1")
				.style("font-weight", "bold")
				.style("padding", "12px")
				.style("background", "rgba(0, 0, 0, .6)")
				.style("color", "fff")
				.style("border-radius", "2px");

	d3.csv("data/sky.csv", function(d) {
		return {
			date: d.Date,
			sky: d.Sky
		};
	}, function(error, rows){
		for (var i = 0; i < rows.length; i++){
			weatherData[rows[i].date] = rows[i].sky;
		}
		changeWeather();
	})

	svg = d3.select("body").append("svg")
    .attr("width", screenWidth)
    .attr("height", screenHeight);
 var q = new Queue();

 map = new Map(svg, projection);
 aps = new APZones(svg, projection);


 params = {date: currDate, starttime: startTime, endtime: endTime, isdrawing: isCount};
 count = new Count(params, svg, aps);
 flux = new Flux(svg, projection, aps);
 map.onReady(q.defer(function() {map.draw();}));
 aps.onReady(q.defer(function() {aps.draw();}));
 count.onReady(q.defer(function() {count.draw(params);}));
};

$("#submitpredict").click(function() {
  	aps.drawPrediction();
});

$("#clearpredict").click(function() {
	aps.clearPredictionPath();
})

var redrawMap = function(){
	map.draw(mapDisplayOpts);
	aps.draw();
	if (isFlux){
		flux.flux(getEpochFromString(startTime), getEpochFromString(endTime));
	}
	count.draw(params);
}

$(".building-toggle").click(function() {
	mapDisplayOpts = {grass: mapDisplayOpts.grass, footways: mapDisplayOpts.footways,  streets: mapDisplayOpts.streets, bldgs: !mapDisplayOpts.bldgs}
	redrawMap();
})
$(".road-toggle").click(function() {	
	mapDisplayOpts = {grass: mapDisplayOpts.grass, footways: mapDisplayOpts.footways,  streets: !mapDisplayOpts.streets, bldgs: mapDisplayOpts.bldgs}
	redrawMap();
})
$(".footway-toggle").click(function() {	
	mapDisplayOpts = {grass: mapDisplayOpts.grass, footways: !mapDisplayOpts.footways,  streets: mapDisplayOpts.streets, bldgs: mapDisplayOpts.bldgs}
	redrawMap();
})
$(".grass-toggle").click(function() {	
	mapDisplayOpts = {grass: !mapDisplayOpts.grass, footways: mapDisplayOpts.footways,  streets: mapDisplayOpts.streets, bldgs: mapDisplayOpts.bldgs}
	redrawMap();
})

var updateCounts = function(){
 	params = {date: currDate, starttime: startTime, endtime: endTime, isdrawing: isCount};
	count = new Count(params, svg, aps);
	var q = new Queue();
	count.onReady(q.defer(function() {count.draw(params);}));
}

var changeDay = function(){
	currDate = $('#typical-picker').val().split(' ').join("_");
	currDataName = "Typical " + $('#typical-picker').val();
	document.getElementById("theDate").textContent = currDataName;
	weatherName = currDataName;
	changeWeather();
	updateCounts();
	return false;
};
var selectDate = function(){
	var month, day, year;
	switch ($('#month-picker').val()){
		case "November":
			month = "11";
			break;
		case "December":
			month = "12";
			break;
		case "January":
			month = "1";
			break;
		case "February":
			month = "2";
			break;
		case "March":
			month = "3";
			break;
	}
	day = String($('#day-picker').val());
	year = String($('#year-picker').val());
	currDataName = month + "-" + day + "-" + year;
	currDate = month + "-" + day + "-" + (year-2000);
	weatherName = year + "-" + month + "-" + day;
	document.getElementById("theDate").textContent = currDataName;
	changeWeather();
	updateCounts();
	if (isFlux) {
		var q = new Queue();
		flux.onReady(q.defer(function() {flux.flux(getEpochFromString(startTime), getEpochFromString(endTime));}));
	}
	flux.loadDay(currDate);
	return false;
};

var redraw = function(){
	params = {date: currDate, starttime: startTime, endtime: endTime, isdrawing: isCount};
	if (isCount){
		flux.flux(0,0);
		count.draw(params);
		aps.togglePredicting(false);
		aps.toggleFluxing(false);
		aps.toggleCounting(true);
		$("#selection")[0].style.visibility = "visible";
		if (selectByDate){
			$("#date")[0].style.visibility = "visible";
			$("#day")[0].style.visibility = "hidden";
		}else{
			$("#date")[0].style.visibility = "hidden";
			$("#day")[0].style.visibility = "visible";
		}
		$("#predict")[0].style.visibility = "hidden";
		$(".range-slider")[0].style.visibility = "visible";
		$(".range-slider")[0].style.visibility = "visible";
		document.getElementById("theDate").textContent = currDate;
		document.getElementById("timeRange").textContent = startTime + "-" + endTime;
		changeWeather();
	}else if (isFlux){
		count.draw(params);
		aps.togglePredicting(false);
		aps.toggleFluxing(true);
		aps.toggleCounting(false);
		$("#selection")[0].style.visibility = "hidden";
		$("#date")[0].style.visibility = "visible";
		$("#day")[0].style.visibility = "hidden";
		$("#predict")[0].style.visibility = "hidden";
		$(".range-slider")[0].style.visibility = "visible";
		$(".range-slider")[0].style.visibility = "visible";
 		flux.flux(getEpochFromString(startTime), getEpochFromString(endTime));
 		changeWeather();
		document.getElementById("theDate").textContent = currDate;
		document.getElementById("timeRange").textContent = startTime + "-" + endTime;
	}else if (isPrediction){
		flux.flux(0,0);
		aps.togglePredicting(true);
		aps.toggleFluxing(false);
		aps.toggleCounting(false);
		count.draw(params);
		$("#selection")[0].style.visibility = "hidden";
		$("#date")[0].style.visibility = "hidden";
		$("#day")[0].style.visibility = "hidden";
		$("#predict")[0].style.visibility = "visible";
		$("#sunny")[0].style.visibility = "hidden";
		$("#cloudy")[0].style.visibility  = "hidden";
		$("#snowy")[0].style.visibility  = "hidden";
		$("#partly-cloudy")[0].style.visibility  = "hidden";
		$("#rainy")[0].style.visibility  = "hidden";
		$("#stormy")[0].style.visibility  = "hidden";
		$(".range-slider")[0].style.visibility = "hidden";
		$("#weekday")[0].style.visibility = "hidden";
		document.getElementById("theDate").textContent = "Brown";
		document.getElementById("timeRange").textContent = "";
	}
};

var toggleSelect = function(){
	selectByDate = !selectByDate;
	if (selectByDate){
		$("#date")[0].style.visibility = "visible";
		$("#day")[0].style.visibility = "hidden";
	}else{
		$("#date")[0].style.visibility = "hidden";
		$("#day")[0].style.visibility = "visible";
	}
};

$(document).ready(function() {
  init();
});


function rangeSlider(id, onDrag) {

	var range = document.getElementById(id),
		dragger1 = range.children[0],
		dragger2 = range.children[1],
		draggerWidth = 10,
		down1 = false,
		down2 = false,
		rangeWidth1,
		rangeLeft1,
		rangeWidth2,
		rangeLeft2;

	dragger1.style.width = draggerWidth + 'px';
	dragger1.style.left = -draggerWidth + 'px';
	dragger1.style.marginLeft = (draggerWidth / 2) + 'px';

	dragger2.style.width = draggerWidth + 'px';
	dragger2.style.left = -draggerWidth + 'px';
	dragger2.style.marginLeft = (draggerWidth / 2) + 'px';

	dragger2.style.position = 'absolute';
	dragger2.style.bottom = '0px';
	dragger2.style.left = '790px';
	dragger2.style.backgroundColor = 'red';

	dragger1.addEventListener("mousedown", function(e) {
		rangeWidth1 = range.offsetWidth;
		rangeLeft1 = range.offsetLeft;
		down1 = true;
		updateDragger1(e);
		return false;
	});

	dragger2.addEventListener("mousedown", function(e) {
		rangeWidth2 = range.offsetWidth;
		rangeLeft2 = range.offsetLeft;
		down2 = true;
		updateDragger2(e);
		return false;
	});

	dragger1.addEventListener("mousemove", function(e){
		redraw();
	});

	dragger2.addEventListener("mousemove", function(e){
		redraw();
	});

	document.addEventListener("mousemove", function(e) {
		updateDragger1(e);
		updateDragger2(e);
	});

	document.addEventListener("mouseup", function() {
		down1 = false;
		down2 = false;
	});

	function updateDragger1(e) {
		if (down1 && e.pageX >= rangeLeft1 && e.pageX <= (rangeLeft1 + rangeWidth1)) {
				if (e.pageX - rangeLeft1 - draggerWidth < parseInt(dragger2.style.left)){
					dragger1.style.left = (e.pageX - rangeLeft1 - draggerWidth)+ 'px';
					startTime = getTimeForSliderPosition(dragger1.style.left);
					timeText.textContent = startTime + " - " + endTime;
					if (typeof onDrag == "function") onDrag(Math.round(((e.pageX - rangeLeft1) / rangeWidth1) * 100));
				}
		}
	}

	function updateDragger2(e) {
		if (down2 && e.pageX >= rangeLeft2 && e.pageX <= (rangeLeft2 + rangeWidth2)) {
			if (e.pageX - rangeLeft2 - draggerWidth > parseInt(dragger1.style.left)){
				dragger2.style.left = (e.pageX - rangeLeft2 - draggerWidth) + 'px';
				endTime = getTimeForSliderPosition(dragger2.style.left);
				timeText.textContent = startTime + " - " + endTime;
				if (typeof onDrag == "function") onDrag(Math.round(((e.pageX - rangeLeft2) / rangeWidth2) * 100));
			}
		}
	}

	function getTimeForSliderPosition(pos){
		//convert incoming position to integer
		pos = parseInt(pos.slice(0, -2)) + 10
		var hour = 0;
		var min = 0;
		var isAM = false;
		var barLength = 800;
		var numHours = 20;
		var hourPix = barLength/numHours;
		var minPix = hourPix/60;
		hour = Math.floor(pos / hourPix);
		pixRemain = pos % hourPix;
		min = Math.floor(pixRemain / minPix);
		hour -= 6;
		if (hour < 0 || hour >= 12){
			isAM = true;
		}
		if (hour == 0) {
			hour += 12;
		}
		else if (hour < 0 && isAM){
			hour += 12;
		}
		else if (hour > 12 && isAM){
			hour -= 12;
		}
		var minStr = String(min);
		if (min < 10) {
			minStr = "0" + minStr;
		}
		if (isAM) {
			return hour + ":" + minStr + " AM"; 
		}else {
			return hour + ":" + minStr + " PM"; 
		}
	}

}

function moveSlider(pos, d) {
	$("#s" + d).css("left", pos);
		if (d == 1) {
			startTime = getTimeForSliderPosition(pos);
		} else {
			endTime = getTimeForSliderPosition(pos);
		}
		timeText.textContent = startTime + " - " + endTime;
		redraw();
		function getTimeForSliderPosition(pos){
		//convert incoming position to integer
		var hour = 0;
		var min = 0;
		var isAM = false;
		var barLength = 800;
		var numHours = 20;
		var hourPix = barLength/numHours;
		var minPix = hourPix/60;
		hour = Math.floor(pos / hourPix);
		pixRemain = pos % hourPix;
		min = Math.floor(pixRemain / minPix);
		hour -= 6;
		if (hour < 0 || hour >= 12){
			isAM = true;
		}
		if (hour == 0) {
			hour += 12;
		}
		else if (hour < 0 && isAM){
			hour += 12;
		}
		else if (hour > 12 && isAM){
			hour -= 12;
		}
		var minStr = String(min);
		if (min < 10) {
			minStr = "0" + minStr;
		}
		if (isAM) {
			return hour + ":" + minStr + " AM"; 
		}else {
			return hour + ":" + minStr + " PM"; 
		}
	}
}

rangeSlider('range-slider-1', function(value) {
});

$('.btn-lg').click(function() {
	if ($(this)[0]['id'] == "flux"){
	    isCount = false;
	    isFlux = false;
	    isPrediction = false;
	  	switch($(this)[0].textContent){
	  		case "Flux":
	  			isFlux = true;
	  			break;
	  		case "Density":
	  			isCount = true;
	  			break;
	  		case "Prediction":
	  			isPrediction = true;
	  			break;
	  	}
		$("#flux").find('.active').toggleClass('active');
		redraw();
	}else{
	    if ($("#dateSwitch").find('.active')[0] != $(this)[0]){
		    toggleSelect();
		}
		$("#dateSwitch").find('.active').toggleClass('active');
	}
    $(this).toggleClass('active');
})

$('#month-picker').click(function() {
	var days = 29;
	$('#day-picker').empty();
	if ($(this).val() == "February") {
		days = 29;
	} else if ($(this).val() == "March"){
		days = 8;
	} else if (has30Days($(this).val())){
		days = 30
	} else {
		days = 31;
	}
	var start = 1;
	if ($(this).val() == "November") {
		start = 12;
	}
	for (var i = start; i <= days; i++) {
		$('#day-picker').append('<option id="' + i + '">' + i + '</option>');
	}
});

$('#year-picker').click(function() {
	console.log("year picker listener");
	$('#month-picker').empty();
	if($(this).val() == "2015") {
		$('#date')[0].style.left = "93px";
		$('#month-picker').append('<option id="November">November</option>');
		$('#month-picker').append('<option id="December">December</option>');
	}else{
		$('#date')[0].style.left = "97px";
		$('#month-picker').append('<option id="January">January</option>');
		$('#month-picker').append('<option id="February">February</option>');
		$('#month-picker').append('<option id="March">March</option>');
	}
})

function has30Days(month) {
	months = ["April", "June", "September", "November"];
	for (i in months) { 
		if (months[i] == month) {
			return true;
		}
	}
	return false;
}

var getEpochFromString = function(timeString) {
	var splitTime = timeString.split(" ");
	var ampm = splitTime[1];
	var hrmin = splitTime[0].split(":");
	var hour = parseInt(hrmin[0]);
	var min = parseInt(hrmin[1]);
	var splitDate = currDate.split("-");
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