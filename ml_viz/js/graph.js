function runViz() {
	var margin = {top: 50, right: 30, bottom: 30, left: 40};
	var width = 900 - margin.left - margin.right;
	var height = 600 - margin.top - margin.bottom;
	var ap_colors = ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"];

	var data = [{name: "Outdoor",
								regulars_average: 0.113858097282,
								regulars_min: 0.07,
								regulars_max: 0.196148501092,
								connection_time_average: 393.874536884,
								connection_time_min: 365.962,
								connection_time_max: 410.347931873},
							{name: "South Walk",
								regulars_average: 0.172673455019,
								regulars_min: 0.167370208259,
								regulars_max: 0.17797670178,
								connection_time_average: 492.117993099,
								connection_time_min: 489.901261359,
								connection_time_max: 494.33472484},
							{name: "Main Green",
								regulars_average: 0.226015447474,
								regulars_min: 0.0647773279352,
								regulars_max: 0.433596318212,
								connection_time_average: 1013.83062401,
								connection_time_min: 315.89957452,
								connection_time_max: 7882.75111111},
							{name: "Pembroke",
								regulars_average: 0.239879549186,
								regulars_min: 0.201464669516,
								regulars_max: 0.255362292125,
								connection_time_average: 405.533652903,
								connection_time_min: 331.173647412,
								connection_time_max: 544.947349999},
							{name: "Mac-BH",
								regulars_average: 0.256147016312,
								regulars_min: 0.256147016312,
								regulars_max: 0.256147016312,
								connection_time_average: 287.898641338,
								connection_time_min: 287.898641338,
								connection_time_max: 287.898641338},
							{name: "Faunce",
								regulars_average: 0.295661095304,
								regulars_min: 0.231928070565,
								regulars_max: 0.391699646089,
								connection_time_average: 1025.65989296,
								connection_time_min: 835.912200796,
								connection_time_max: 1395.72096794},
							{name: "Ittleson",
								regulars_average: 0.334844124986,
								regulars_min: 0.268541149513,
								regulars_max: 0.4227602663,
								connection_time_average: 592.349737115,
								connection_time_min: 488.621453122,
								connection_time_max: 745.067362774},
							{name: "Ratty",
								regulars_average: 0.339920012614,
								regulars_min: 0.156986164776,
								regulars_max: 0.663692020338,
								connection_time_average: 830.77697395,
								connection_time_min: 378.082536552,
								connection_time_max: 1292.17090381}];

	svg = d3.select("body").append("svg")
	    			.attr("width", width + margin.left + margin.right)
	    			.attr("height", height + margin.top + margin.bottom)
	  				.append("g")
	    			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// var xScale = d3.scale.linear()
	// 				    .domain([0, d3.max(data, function(d) {return d.connection_time_max;})])
	// 				    .range([0, width]);

	var xScale = d3.scale.linear()
					.domain([0, 2400])
					.range([0, width]);

	var yScale = d3.scale.linear()
						.domain([0, d3.max(data, function(d) {return d.regulars_max;})])
						.range([height, 0]);

	var xAxis = d3.svg.axis()
			    	.scale(xScale)
			    	.orient("bottom")
			    	.tickFormat(
			    		function(d) {
			    			if(d % 60 == 0) {
			    				return Math.round(d/60) + "m";
			    			} else {
			    				return "";
			    			}
			    	});

	var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left");

					//axis labels sampled http://bl.ocks.org/phoebebright/3061203
  	var gx = svg.append("g")
			    .attr("class", "x axis")
			    .attr("transform", "translate(0," + height + ")")
			    .call(xAxis)
			    .append("text")
			    .attr("class", "label")
			    .attr("x", width)
			    .attr("y", -6)
			    .style("text-anchor", "end")
			    .attr("font", "Alte Haas Grotesk")
			    .text("Connection Time (min)");

	var yx = svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
			    .attr("class", "label")
			    .attr("transform", "rotate(-90)")
			    .attr("y", 6)
			    .attr("dy", ".71em")
			    .style("text-anchor", "end")
			    .attr("font", "Alte Haas Grotesk")
				.text("Regulars Rating (repeat users / connection)");

	d3.selectAll(".axis")
		.attr("fill", "none")
		.attr("stroke", "#000")
		.attr("shape-rendering", "crispEdges");

	var lineWidth = 3;
  //reg variance
	svg.selectAll("regulars variance")
		.data(data)
		.enter()
		.append("line")
		.attr("class", "variance")
		.attr("stroke", function(d, i) {return ap_colors[i];})
		// .attr("stroke", "#2171b5")
		.attr("stroke-width", lineWidth)
		.attr("x1", function(d) {return xScale(d.connection_time_average);})
		.attr("x2", function(d) {return xScale(d.connection_time_average);})
		.attr("y1", function(d) {return yScale(d.regulars_min);})
		.attr("y2", function(d) {return yScale(d.regulars_max);})

  //connection time variance
	svg.selectAll("connection variance")
			.data(data)
			.enter()
			.append("line")
			.attr("class", "variance")
			.attr("stroke", function(d, i) {return ap_colors[i];})
			// .attr("stroke", "#2171b5")
			.attr("stroke-width", lineWidth)
			.attr("x1", function(d) {return xScale(d.connection_time_min);})
			.attr("x2", function(d) {return xScale(d.connection_time_max);})
			.attr("y1", function(d) {return yScale(d.regulars_average);})
			.attr("y2", function(d) {return yScale(d.regulars_average);})

	svg.selectAll("dot")
			.data(data)
			.enter()
			.append("circle")
			.attr("fill", function(d, i) {return ap_colors[i];})
			.attr("stroke", "black")
			.attr("stroke-width", 1)
			.attr("r", 5)
			.attr("cx", function(d) {return xScale(d.connection_time_average);})
			.attr("cy", function(d) {return yScale(d.regulars_average);});

	//create legend
	legend = svg.append("g")
				.selectAll("g")
				.data(data)
				.enter()
				.append("g")
				.attr("class", "legend")
				.attr("transform", function(d, i) {return "translate(" + (width * 0.65) + "," + (50 + (i * 20)) + ")";});

	legend.append("circle")
		.attr("fill", function(d, i) {return ap_colors[i];})
		.attr("stroke", "black")
		.attr("r", 8);

	legend.append("text")
		.style("font-size", 18)
		.attr("y", 5)
		.style("text-anchor", "left")
		.attr("x", 9)
		.attr("font", "Alte Haas Grotesk")
		.text(function(d) {return d.name;});

	d3.selectAll("text")
		  .style("stroke-width", 0)
			    .style("fill", "black");

}
runViz();
