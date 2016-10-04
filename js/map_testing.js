var botLat = 41.822789;
var leftLng = -71.406902;
var topLat = 41.832495;
var rightLng = -71.4;

var worldWidth = Math.abs(rightLng-leftLng);
var worldHeight = Math.abs(topLat-botLat);


var screenWidth = Math.min($(window).width(), $(document).width());
var screenHeight = Math.min($(window).height(), $(document).height());

var q = queue();

var isCount = true;
var selectByDate = true;
var showMap = true;
var count = {};
var flux = {};
var currDate = "113015";
var map = {};

document.getElementById("dateSwitch").onClick()

var initMap = function(){
  d3.json("data/osm_map.json", function(error, json) {
    if (error) return console.warn(error)
    map = json
    console.log(map)
    drawMap();
  })


};
var changeDay = function(){};
var selectDate = function(){};
var pullData = function(){};
var toggleFlux = function(){
 isCount = !isCount;
 draw();
};
var toggleMap = function(){
 showMap = !showMap;
 draw();
};
var toggleSelect = function(){
 selectByDate = !selectByDate;
 //hide and show correct div
};
var drawFlux = function(){};
var drawCount = function(){};
var drawMap = function(){
  var s = .75 * 7000000,
      t = [screenWidth / 2, screenHeight / 2];


  var projection = d3.geo.transverseMercator();

 var path = d3.geo.path()
            .projection(projection);
         
  projection
    .scale(s)
    .translate(t)
    .rotate([71 + 24.106/60, -41 - 49.66/60, -5]);


  var svg = d3.select("body").append("svg")
    .attr("width", screenWidth)
    .attr("height", screenHeight);

  var x = d3.scale.linear()
    .domain([leftLng, rightLng])
    .range([0, Math.min(screenHeight, screenWidth)]);

  var y = d3.scale.linear()
    .domain([topLat, botLat])
    .range([0, Math.min(screenHeight, screenWidth)]);
  lat_rng = [];
  lng_rng = []
  for(var i = 0, len=map.bldgs.length-1; i < len; i++) {
    for(var j = 0, jlen=map.bldgs[i].length-1; j < jlen; j++) {
      elem = map.bldgs[i][j];
      //console.log(elem);
      var coords = projection([elem[1], elem[0]]);
      lat_rng.push(coords[1]);
      lng_rng.push(coords[0]);
    }
  }
  console.log(screenHeight + ", " + screenWidth);
  console.log(lat_rng);
  console.log(d3.extent(lat_rng));
  console.log(d3.extent(lng_rng));
  // var line = d3.svg.line()
  //   .x(function(d) { return x(d[1])})
  //   .y(function(d) { return y(d[0])})
  //   .interpolate("linear");
  var line = d3.svg.line()
    .x(function(d) { return projection([d[1], d[0]])[0]})
    .y(function(d) { return projection([d[1], d[0]])[1]});

  var grassGroup = svg.append("g")
    .attr("class", "grass")
    .selectAll("g")
    .data(map.grass)
    .enter().append("path")
    .attr("d", function(d) { return line(d[1]); })
    .attr("id", function(d) { return d[0] });

  var footwayGroup = svg.append("g")
    .attr("class", "footway")
    .selectAll("g")
    .data(map.footways)
    .enter().append("path")
    .attr("d", function(d) { return line(d[1]); })
    .attr("id", function(d) { return d[0] });

  var streetGroup = svg.append("g")
    .attr("class", "street")
    .selectAll("g")
    .data(map.streets)
    .enter().append("path")
    .attr("d", function(d) { return line(d[1]); })
    .attr("id", function(d) { return d[0] });

var bldgGroup = svg.append("g");
  var bldgs = bldgGroup
    .attr("class", "bldg")
    .selectAll("g")
    .data(map.bldgs)
    .enter().append("path")
    .attr("d", function(d) { return line(d[1]); })
    .attr("id", function(d) { return d[0]; });

// d3.csv("data/aps_latlng.csv", function(d) { 
//   return {
//     apid: d.ap_i, 
//     name: d.ap_name1, 
//     lat: +d.latitude, 
//     lng: +d.longitude }; 
//   }, function(error, rows) {
//     var apGroup = svg.append("g")
//       .attr("class", "ap-circles")
//       .selectAll("circle")
//       .data(rows)
//       .enter().append("circle")
//       .attr("r", 10)
//       .attr("cx", function(d) { return projection([d.lng, d.lat])[0];})
//       .attr("cy", function(d) { console.log(d.apid + " " + projection([d.lng, d.lat])[0]); return projection([d.lng, d.lat])[1];});
//   });

};
var changeWeather = function(){};

var draw = function(error){
 if (showMap) {
  drawMap();
 }
 if (isCount) {
  drawCount();
 } else {
  drawFlux();
 }
};

$(document).ready(function() {
  initMap();
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

 console.log(range)

 dragger1.style.width = draggerWidth + 'px';
 dragger1.style.left = -draggerWidth + 'px';
 dragger1.style.marginLeft = (draggerWidth / 2) + 'px';

 dragger2.style.width = draggerWidth + 'px';
 dragger2.style.left = -draggerWidth + 'px';
 dragger2.style.marginLeft = (draggerWidth / 2) + 'px';

 dragger2.style.position = 'absolute';
 dragger2.style.bottom = '0px';
 dragger2.style.left = '290px';
 dragger2.style.backgroundColor = 'blue';

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

 document.addEventListener("mousemove", function(e) {
  updateDragger1(e);
  updateDragger2(e);
 });

 document.addEventListener("mouseup", function() {
  down1 = false;
  down2 = false;
 });

 var SNAP = 15;

 function updateDragger1(e) {
  if (down1 && e.pageX >= rangeLeft1 && e.pageX <= (rangeLeft1 + rangeWidth1)) {
    if (e.pageX - rangeLeft1 - draggerWidth < parseInt(dragger2.style.left)){
     dragger1.style.left = (e.pageX - rangeLeft1 - draggerWidth)+ 'px';
     if (typeof onDrag == "function") onDrag(Math.round(((e.pageX - rangeLeft1) / rangeWidth1) * 100));
    }
  }
 }

 function updateDragger2(e) {
  if (down2 && e.pageX >= rangeLeft2 && e.pageX <= (rangeLeft2 + rangeWidth2)) {
   if (e.pageX - rangeLeft2 - draggerWidth > parseInt(dragger1.style.left)){
    dragger2.style.left = (e.pageX - rangeLeft2 - draggerWidth) + 'px';
    if (typeof onDrag == "function") onDrag(Math.round(((e.pageX - rangeLeft2) / rangeWidth2) * 100));
   }
  }
 }

}
rangeSlider('range-slider-1', function(value) {
});

$('.btn-toggle').click(function() {
    $(this).find('.btn').toggleClass('active');  
    
    if ($(this).find('.btn-primary').size()>0) {
     $(this).find('.btn').toggleClass('btn-primary');
    }
    if ($(this).find('.btn-success').size()>0) {
     $(this).find('.btn').toggleClass('btn-success');
     toggleSelect();
    }
    
    $(this).find('.btn').toggleClass('btn-default');
       
});

$('.flux-toggle').click(function() {
 toggleFlux();
})

$('.map-toggle').click(function() {
 toggleMap();
})

$('form').submit(function(){
 alert($(this["options"]).val());
    return false;
});
/*

//make APs initially
var initAPs = function(callback){
 $.getJSON("/aps", function(responseJSON) {
  aps = responseJSON.data;
  
  for (var i = 0; i < aps.length; i++){
   counts[aps[i].apid] = 0;
   if (colors[aps[i].id] != null){
    continue;
   }
   colors[aps[i].id] = "hsl(" + Math.floor(Math.random()*360) + ",100%,50%)";
  }
  callback();
 })
}

//get data for time interval
var getData = function(t1, callback){
 console.log("getting data");
 d3.select("#loading").style("visibility", "visible");
 if (cache[t1] != null){
  currentData = cache[t1];
  for (var i = 0; i < currentData.length; i++){
   counts[currentData[i].apid] = currentData[i].count;
  }
  d3.select("#loading").style("visibility", "hidden");
  callback();
  return;
 }

 var toServer = {
  start_epoch: t1,
  end_epoch: t1 + bucketSize
 }
 currentData = [];
 counts = {};

 $.post("/clients_in_window", toServer, function(responseJSON) {
  var response  = JSON.parse(responseJSON);
  if (!response.success){
   alert("data pull unsuccessful");
   d3.select("#loading").style("visibility", "visible");
  }
  currentData = response.data;
  cache[t1] = currentData;
  
  console.log(currentData.length);

  for (var i = 0; i < currentData.length; i++){
   counts[currentData[i].apid] = currentData[i].count;
  }
  

  d3.select("#loading").style("visibility", "hidden");
  callback();
 })
}

//on load
$(document).ready(function(){
 svg = d3.select(".switch")
     .append("svg")
     .attr("width", screenWidth)
     .attr("height", screenHeight)
     .append("g");
 

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
    
    // q.defer(drawMap)
    // .await(function(error){})
    // .defer(initAPs)
    // .await(function(error){})
    // .defer(getData, classDay)
    // .await(function(error){})
    // .defer(drawCircles)
    // .await(function(error){});
    drawMap(function(){
     initAPs(function(){
      drawInitAPs();
      getData(classDay, function(){
       drawCircles();
      });
     });
    });
    drawFlux();
})

var drawMap = function(callback){
 var toServer = {
   "lat_low": botLat,
   "lat_high": topLat,
   "lng_low": leftLng,
   "lng_high": rightLng
 }
 $.post("/map_nodes", toServer, function(responseJSON) {
  var response  = JSON.parse(responseJSON);
  if (!response.success){
   alert("data pull unsuccessful");
  }
  
  var nodeData = response.nodes;
  ways = response.ways;
 
  
  for (var i = 0; i < nodeData.length; i++){
   nodeMap[nodeData[i]["id"]] = {'lat': nodeData[i]["lat"],
     'lng': nodeData[i]["lng"]};
  }
  
  svg.selectAll("line")
   .data(ways)
   .enter()
   .append("line")
   .attr("class", "way")
   .attr("id", function(d) {return d['id'];})
   .on("click", function(d) {var idx = ways_to_delete.indexOf(d3.select(this).attr('id'));
          if (idx >= 0) {
          ways_to_delete.splice(idx, 1);
          d3.select(this).style("stroke", "black");
           } else {
            ways_to_delete.push(d3.select(this).attr('id'));
            d3.select(this).style("stroke", "#f9f9f9");
            var x1 = d3.select(this).attr('x1');
            var y1 = d3.select(this).attr('y1');
            //select everything within 10 pixels
            $('.way').each(function(i, obj) {
             var xdiff = Math.abs(x1 - d3.select(obj).attr('x1'));
             var ydiff = Math.abs(y1 - d3.select(obj).attr('y1'));
             
             if (xdiff < 20 && ydiff < 10) {
              ways_to_delete.push(d3.select(obj).attr('id'));
              d3.select(obj).style("stroke", "#f9f9f9");
             }
            });
           }
           console.log(ways_to_delete);
           })
   .attr("x1", function(d){
    return Math.abs(nodeMap[d["start_node_id"]]['lng']-leftLng)/worldWidth*$(window).width();
   })
   .attr("y1", function(d){
    return Math.abs(nodeMap[d["start_node_id"]]['lat']-topLat)/worldHeight*$(window).height();
   })
   .attr("x2", function(d){
    return Math.abs(nodeMap[d["end_node_id"]]['lng']-leftLng)/worldWidth*$(window).width();
   })
   .attr("y2", function(d){
    return Math.abs(nodeMap[d["end_node_id"]]['lat']-topLat)/worldHeight*$(window).height();
   })
         .attr("stroke-width", 2)
         .attr("stroke", "black");

  
  callback();
 })
}

function showWays() {
 alert(ways_to_delete.length);
 var toServer = {
  "nodes": JSON.stringify(ways_to_delete)
 };
 $.post("/delete_nodes", toServer, function(responseJSON) {
  //do nothing
 });
 ways_to_delete = [];
}

//drawing APs initially
var drawInitAPs = function(){
 svg.selectAll("circle")
  .data(aps)
  .enter()
  .append("circle")
  .attr("cx", function(d){
   return Math.abs(d.lng-leftLng)/worldWidth*$(window).width();
  })
  .attr("cy", function(d){
   return Math.abs(d.lat-topLat)/worldHeight*$(window).height();
  })
  .attr("r", SCALE*5)
  .style("stroke-width", 4)
  .style("fill", function(d, i){
   return colors[d.id];
  })
  .attr("opacity", .5)
  .attr("id", function(d){
   return d.name;
  })
  .attr("class", "apcircle")
  .on("mouseover", function () {
            var myID = d3.select(this).attr("id");
   tooltip.style("visibility", "visible")
             .html(function (){
              return "<span style='color:white'>" + myID + "</span>";
             });
     })
     .on("mousemove", function(){
         tooltip.style("top", (event.pageY + 10) + "px")
                .style("left", (event.pageX) + "px");
     })
     .on("mouseout", function () {
         tooltip.style("visibility", "hidden");
     });
     
     
 for (var i = 0; i < aps.length; i++){
  counts[i] = 0;
 }
}

//modifies circles
var drawCircles = function(callback){
 console.log("in draw circles");
 svg.selectAll("circle")
  .transition()
  .duration(1000)
  .attr("r", function(d, i){
   return SCALE*Math.sqrt(counts[d.id]);
  });
 callback();
}

//determines which circles to draw
var draw = function(){
 var currDay;
 if (!$('input').is(':checked')){
  currDay = classDay;
 }else{
  currDay = nonClassDay;
 }
 // q.defer(getData, currDay)
 // .await(function(error){})
 // .defer(drawCircles)
 // .await(function(error){});
 getData(currDay, function(){
  drawCircles();
 });
 
}

//resizes
$(window).resize(function(){
 svg.selectAll("circle")
  .transition()
  .duration(1000)
  .attr("cx", function(d){
   return Math.abs(d.lng-leftLng)/worldWidth*$(window).width();
  })
  .attr("cy", function(d){
   return Math.abs(d.lat-topLat)/worldHeight*$(window).height();
  });
 
 svg.selectAll("line")
  .transition()
  .duration(1000)
  .attr("x1", function(d){
   return Math.abs(nodeMap[d["start_node_id"]]['lng']-leftLng)/worldWidth*$(window).width();
  })
  .attr("y1", function(d){
   return Math.abs(nodeMap[d["start_node_id"]]['lat']-topLat)/worldHeight*$(window).height();
  })
  .attr("x2", function(d){
   return Math.abs(nodeMap[d["end_node_id"]]['lng']-leftLng)/worldWidth*$(window).width();
  })
  .attr("y2", function(d){
   return Math.abs(nodeMap[d["end_node_id"]]['lat']-topLat)/worldHeight*$(window).height();
  })
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
 dragger2.style.left = '290px';
 dragger2.style.backgroundColor = 'blue';

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

 document.addEventListener("mousemove", function(e) {
  updateDragger1(e);
  updateDragger2(e);
 });

 document.addEventListener("mouseup", function() {
  down1 = false;
  down2 = false;
 });

 var SNAP = 15;

 function updateDragger1(e) {
  if (down1 && e.pageX >= rangeLeft1 && e.pageX <= (rangeLeft1 + rangeWidth1)) {
    if (e.pageX - rangeLeft1 - draggerWidth < parseInt(dragger2.style.left)){
     dragger1.style.left = SNAP * Math.round((e.pageX - rangeLeft1 - draggerWidth)/SNAP) + 'px';
     if (typeof onDrag == "function") onDrag(Math.round(((e.pageX - rangeLeft1) / rangeWidth1) * 100));
    }
  }
 }

 function updateDragger2(e) {
  if (down2 && e.pageX >= rangeLeft2 && e.pageX <= (rangeLeft2 + rangeWidth2)) {
   if (e.pageX - rangeLeft2 - draggerWidth > parseInt(dragger1.style.left)){
    dragger2.style.left = SNAP * Math.round((e.pageX - rangeLeft2 - draggerWidth)/SNAP) + 'px';
    if (typeof onDrag == "function") onDrag(Math.round(((e.pageX - rangeLeft2) / rangeWidth2) * 100));
   }
  }
 }

}
rangeSlider('range-slider-1', function(value) {
});

var drawFlux = function(){
 var toServer = {
  start_epoch: classDay,
  end_epoch: classDay + bucketSize
 }

 $.post("/fluxes_in_window", toServer, function(responseJSON) {
  var response  = JSON.parse(responseJSON);
  if (!response.success){
   alert("data pull unsuccessful");
  }
  
  var fluxData = response.data;
  console.log(fluxData);

  var newsvg = d3.select(".switch")
     .append("svg")
     .attr("width", screenWidth)
     .attr("height", screenHeight)
     .append("g")
     .selectAll("line");

     newsvg
   .data(fluxData)
   .enter()
   .append("line")
   .attr("x1", function(d){
    return Math.abs(locMap[d["start_zone"]][1]-leftLng)/worldWidth*$(window).width();
   })
   .attr("y1", function(d){
    return Math.abs(locMap[d["start_zone"]][0]-topLat)/worldHeight*$(window).height();
   })
   .attr("x2", function(d){
    return Math.abs(locMap[d["end_zone"]][1]-leftLng)/worldWidth*$(window).width();
   })
   .attr("y2", function(d){
    return Math.abs(locMap[d["end_zone"]][0]-topLat)/worldHeight*$(window).height();
   })
         .attr("stroke-width", function(d){
          return d["count"];
         })
         .attr("stroke", function(d){
          switch (d["start_zone"]){
           case "Ittleson":
            return "red"
           case "Main Campus Green":
            return "blue"
           case "Outdoor":
            return "orange"
           case "Pembroke Campus":
            return "gray"
           case "South Walk":
            return "green"
           case "Mac-BH":
            return "brown"
           case "Faunce":
            return "purple"
           case "Sharpe Refectory":
            return "yellow"
          }
         })
         .attr("opacity", .5);
         
  newsvg
  .data(fluxData)
  .enter()
  .append("circle")
  .attr("cx", function(d){
    return Math.abs(locMap[d["start_zone"]][1]-leftLng)/worldWidth*$(window).width();
  })
  .attr("cy", function(d){
    return Math.abs(locMap[d["start_zone"]][0]-topLat)/worldHeight*$(window).height();
  })
  .attr("r", SCALE*5)
  .style("stroke-width", 4)
  .style("fill", function(d, i){
         switch (d["start_zone"]){
          case "Ittleson":
           return "red"
          case "Main Campus Green":
           return "blue"
          case "Outdoor":
           return "orange"
          case "Pembroke Campus":
           return "gray"
          case "South Walk":
           return "green"
          case "Mac-BH":
           return "brown"
          case "Faunce":
           return "purple"
          case "Sharpe Refectory":
           return "yellow"
          }
        })
        .attr("opacity", .1);
 })
}
*/