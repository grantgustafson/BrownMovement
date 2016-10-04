function runViz() {
	var colors;
	//all colors palettes taken from https://bl.ocks.org/mbostock/5577023
	// colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58"]; //original crime palette
	colors = ["#fff7fb","#ece7f2","#d0d1e6","#a6bddb","#74a9cf","#3690c0","#0570b0","#045a8d","#023858"]; //blues
	// colors = ["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]; //orange
	// colors = ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]; //green
	// colors = ["#fcfbfd","#efedf5","#dadaeb","#bcbddc","#9e9ac8","#807dba","#6a51a3","#54278f","#3f007d"]; //purple
	colors = colors.reverse();
	//basic setup came from http://bl.ocks.org/tjdecke/5558084
	var margin = {top: 50, right: 30, bottom: 50, left: 120};
	var width = 1010 - margin.left - margin.right;
	var height = 200 - margin.top - margin.bottom;
	var rectSize = 75;
	var numColumns = 10;
	var legendElementWidth = rectSize;

	var x, y, svg;

	// top 1 class vs non
	var weights = [{name: "Ittleson", weight: 0.953333333333}, {name: "Main Green", weight: 0.948421052632},
				 {name: "Outdoor", weight: 0.953230769231}, {name: "Pembroke", weight: 0.945461538462},
				 {name: "South Walk", weight: 0.949538461538}, {name: "Mac-BH", weight: 0.945538461538},
				 {name: "Faunce", weight: 0.948102564103}, {name: "Ratty", weight: 0.951582417582}];

	// // top 1 precip vs non
	// var weights = [{name: "Ittleson", weight: 0.697846153846}, {name: "Main Green", weight: 0.69771659919},
	// 			{name: "Outdoor", weight: 0.697846153846}, {name: "Pembroke", weight: 0.697230769231},
	// 			{name: "South Walk", weight: 0.697846153846}, {name: "Mac-BH", weight: 0.697846153846},
	// 			{name: "Faunce", weight: 0.697846153846}, {name: "Ratty", weight: 0.69767032967}];

	// // top 3 class vs non
	// var weights = [{name: "Ittleson", weight: 0.923452991453}, {name: "Main Green", weight: 0.921608636977},
	// 			 {name: "Outdoor", weight: 0.921675213675}, {name: "Pembroke", weight: 0.917666666667},
	// 			 {name: "South Walk", weight: 0.916051282051}, {name: "Mac-BH", weight: 0.917128205128},
	// 			 {name: "Faunce", weight: 0.928547008547}, {name: "Ratty", weight: 0.925948717949}];

	// // top 3 precip vs non
	// var weights = [{name: "Ittleson", weight: 0.670598290598}, {name: "Main Green", weight: 0.666904183536},
	// 			{name: "Outdoor", weight: 0.669504273504}, {name: "Pembroke", weight: 0.673435897436},
	// 			{name: "South Walk", weight: 0.674717948718}, {name: "Mac-BH", weight: 0.690256410256},
	// 			{name: "Faunce", weight: 0.677367521368}, {name: "Ratty", weight: 0.67252014652}];

	// // top 5 class vs non
	// var weights = [{name: "Ittleson", weight: 0.794379487179}, {name: "Main Green", weight: 0.793217813765},
	// 			 {name: "Outdoor", weight: 0.789723076923}, {name: "Pembroke", weight: 0.790338461538},
	// 			 {name: "South Walk", weight: 0.789938461538}, {name: "Mac-BH", weight: 0.790584615385},
	// 			 {name: "Faunce", weight: 0.797435897436}, {name: "Ratty", weight: 0.795358241758}];
	// //top 5 precip vs non
	// var weights = [{name: "Ittleson", weight: 0.649641025641}, {name: "Main Green", weight: 0.647028340081},
	// 			{name: "Outdoor", weight: 0.648964102564}, {name: "Pembroke", weight: 0.653215384615},
	// 			{name: "South Walk", weight: 0.6516}, {name: "Mac-BH", weight: 0.662461538462},
	// 			{name: "Faunce", weight: 0.653682051282}, {name: "Ratty", weight: 0.652158241758}];

	svg = d3.select("body").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)

	//for spacing the rectangles
	x = d3.scale.linear()
				.domain([0, numColumns])
				.range([0, width]);

	y = function(i) {return Math.floor(i / numColumns) * rectSize;}

	//http://bl.ocks.org/tjdecke/5558084
	var colorScale = d3.scale.quantile()
    							.domain([d3.min(weights, function(d) {return +(d.weight);}),
    							 d3.max(weights, function(d) {return +(d.weight);})])
    							.range(colors);

	rects = svg.append("g")
				.selectAll("g")
				.data(weights)
				.enter()
				.append("g")
				.attr("class", "ap")
				.attr("transform", function(d, i) {return "translate(" + x(i % numColumns) + "," + (y(i) * 1.3) + ")";});


	rects.append("rect")
		.attr("height", rectSize)
		.attr("width", rectSize)
		.attr("rx", 7)
		.attr("stroke-width", 2)
		.attr("stroke", "#c4c4c4")
		.attr("fill", function(d) {return colorScale(d.weight);})

	rects.append("text")
		.style("font-size", 14)
		// .style("font", "sans-serif")
		.attr("y", rectSize + 12)
		.style("text-anchor", "middle")
		.attr("x", rectSize / 2)
		// .attr("fill", "white")
		.text(function(d) {return d.name;});

	//create legend
	//legend modeled from: http://bl.ocks.org/tjdecke/5558084
	var legend = svg.selectAll(".legend")
	    		    .data([d3.min(weights, function(d) {return +(d.weight);})].concat(colorScale.quantiles()), function(d) {return d;});

	//add groups to legend
 	legend.enter().append("g")
				  .attr("class", "legend");

	svg.selectAll("g")
		.attr("width", width)

	//add and color blocks of legend according to
	legend.append("rect")
		  .attr("x", function(d, i) { return legendElementWidth * i; })
		  .attr("y", height)
		  .attr("width", legendElementWidth)
		  .attr("height", rectSize / 4)
		  .attr("stroke-width", 2)
		  .attr("stroke", "#c4c4c4")
		  .style("fill", function(d, i) { return colors[i]; });

	//add range labels to the legend
	legend.append("text")
		  // .style("font", "sans-serif")
		  .attr("class", "mono")
		  .text(function(d) {return "≥ " + Math.round(d * 10000) / 100 + "%"; })
		  .attr("x", function(d, i) { return legendElementWidth * i + 4; })
		  .attr("y", height + (rectSize / 2) - 5);

	legend.exit().remove();
}
runViz();
