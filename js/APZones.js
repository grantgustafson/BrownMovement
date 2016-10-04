var APZones = function(svg, projection) {
 this.svg = svg;
 this.projection = projection;
 this.defaultRadius = 10;
 this.maxRadius = 0;
 this.MAXPOSSIBLERADIUS = 50;
 var self = this;
 this.zoneMap = {};
 this.sizes = {};
 this.apGroup = undefined;
 this.predictionPath = [];
 this.predictions = {};
 this.activePrediction = false;
 this.onReadyCallbacks = [];
 this.isPredicting = false;
 this.isFluxing = false;
 this.fluxClick = false;
 this.isCounting = true;
 d3.json("data/predictions.json", function(error, json) {
    //read in stuff here
    for (var path in json) {
      self.predictions[path] = json[path];
    }
  });

 d3.json("data/ap_groups.json", function(error, json) {
  if (error) return console.warn(error);
  self.zones = json;
  for (var zoneID in self.zones) {
   var zone = self.zones[zoneID];
   self.zoneMap[zone['zone']] = zone;
  }
  self.ready();
 });
};

APZones.prototype.ready = function() {
 this.onReadyCallbacks.forEach(function(callback) {
  callback();
 });
};

APZones.prototype.onReady = function(func) {
 this.onReadyCallbacks.push(func);
};

APZones.prototype.getZones = function() {
 return this.zones;
};

APZones.prototype.getZoneMap = function() {
 return this.zoneMap;
};

APZones.prototype.togglePredicting = function(thebool) {
  this.isPredicting = thebool;
}

APZones.prototype.toggleFluxing = function(thebool) {
  this.isFluxing = thebool;
}

APZones.prototype.toggleCounting = function(thebool) {
  this.isCounting = thebool;
}

APZones.prototype.getZoneByName = function(name) {
 if (this.zoneMap.hasOwnProperty(name)) return this.zoneMap[name];
 else return undefined;
};

APZones.prototype.draw = function() {
  var self = this;
  if (this.apGroup != undefined) {
    this.apGroup.remove();
  }
this.apGroup = this.svg.append("g").attr("class", "ap-circles");
this.apGroup.selectAll("circle").data(this.zones)
  .enter().append("circle").attr("r", this.defaultRadius)
  .attr("cx", function(d) { return projection([d.lng, d.lat])[0]; })
  .attr("cy", function(d) { return projection([d.lng, d.lat])[1]; })
  .attr("id", function(d) { return d.zone; })
  .attr("fill", function(d) { return d.color; })
  .on("click", function(d) {
    if (self.isPredicting){
      if (self.activePrediction) {//reset colors after prediction
        self.clearPredictionPath();
      }
      self.addToPredictionPath(d.zone);
    }
    if (self.isFluxing) {
      self.fluxClick = !self.fluxClick;
      self.svg.select(".flux-paths")
              .selectAll("path")
              .style("opacity", 0);
      if (self.fluxClick) { //select all incoming
          self.svg.select(".flux-paths")
              .selectAll("path[data-dest=" + d.zone + "]")
              .style("opacity", 1);
      } else { //select all outgoing
        self.svg.select(".flux-paths")
            .selectAll("." + d.zone + "-path")
            .style("opacity", 1);
      }
    }
  })
  .on("mouseover", function(d) {
    if (self.isFluxing) {
      self.svg.select(".flux-paths")
          .selectAll("path")
          .style("opacity", 0);
      self.svg.select(".flux-paths")
          .selectAll("." + d.zone + "-path")
          .style("opacity", 1);
    } else if (self.isCounting) {
      var c = Math.floor(self.sizes[d.zone] * self.maxRadius / self.MAXPOSSIBLERADIUS);
      tooltip.style("visibility", "visible")
        .html("<span style='color:white'>Density: " + c + "</span>");
    }
  })
  .on("mouseout", function(d) {
    if (self.isFluxing) {
      self.fluxClick = false;
      self.svg.select(".flux-paths")
          .selectAll("path")
          .style("opacity", 1);
    } else if (self.isCounting) {
      tooltip.style("visibility", "hidden");
    }
  })
  .on("mousemove", function(d) {
    if (self.isCounting) {
      tooltip.style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX) + "px");
    }
  });
}

APZones.prototype.updateZoneRadii = function(sizes, duration, defaultR, maxRadius) {
 var self = this;
 defaultR = defaultR || this.defaultRadius;
 duration = duration || 5;
 this.sizes = sizes || {};
 this.maxRadius = maxRadius;
 this.apGroup.selectAll("circle").attr("r", function (d) { return self.sizes[d.zone] || defaultR; });
};

APZones.prototype.addToPredictionPath = function(ap) {
  var self = this;
  var idx = this.predictionPath.indexOf(ap);
  //check if it's in the predictionPath list
  if (idx >= 0) {//if it is remove it
    this.predictionPath.splice(idx, 1);
    d3.select("#" + ap)
      .attr("stroke-width", 1)
      .attr("stroke", "black")
      .attr("fill", function(d) {return d.color;});
  } else if (this.predictionPath.length < 3){//if it is not, add it
    this.predictionPath.push(ap);
    //highlight with white border
    d3.select("#" + ap)
      .attr("stroke-width", 3)
      .attr("stroke", "green")
      .attr("fill", "green");
  }
  self.updatepredictionPath();
}

APZones.prototype.clearPredictionPath = function() {
  svg.selectAll(".prediction").remove();
  d3.select(".ap-circles")
    .selectAll("circle")
    .attr("fill", function(d) {return d.color;})
    .attr("stroke-width", 1)
    .attr("stroke", "black");
  this.activePrediction = false;
  this.predictionPath = [];
}

//draws predictionPath lines on the map
APZones.prototype.updatepredictionPath = function() {
  svg.selectAll(".prediction").remove();
  if (this.predictionPath.length > 1) {//can't draw with only one
    for (var i = 0; i < this.predictionPath.length - 1; i++) {
      var pt1 = this.zoneMap[this.predictionPath[i]];
      var pt2 = this.zoneMap[this.predictionPath[i + 1]];
      d3.select('.ap-circles').append("line")
        .attr("class", "prediction")
        .attr("x1", projection([pt1.lng, pt1.lat])[0])
        .attr("y1", projection([pt1.lng, pt1.lat])[1])
        .attr("x2", projection([pt2.lng, pt2.lat])[0])
        .attr("y2", projection([pt2.lng, pt2.lat])[1])
        .attr("stroke", "green")
        .attr("stroke-width", 2);
    }
  }
}

APZones.prototype.drawPrediction = function() {
  if (this.predictionPath.length > 0) {
    var path = "";
    for (var i in this.predictionPath) {
      path += this.predictionPath[i];
      if (i != this.predictionPath.length - 1) {
        path += ":";
      }
    }
    var target = this.predictions[path];
    if (target == null) {
      alert("Insufficient Data");
      this.clearPredictionPath();
    } else {
      this.activePrediction = true;
      var lastIdx = this.predictionPath.length - 1;
      var last = this.zoneMap[this.predictionPath[lastIdx]];
      var ap = this.zoneMap[target];
      d3.select('.ap-circles').append("line")
        .attr("class", "prediction")
        .attr("x1", projection([last.lng, last.lat])[0])
        .attr("y1", projection([last.lng, last.lat])[1])
        .attr("x2", projection([ap.lng, ap.lat])[0])
        .attr("y2", projection([ap.lng, ap.lat])[1])
        .attr("stroke", "red")
        .attr("stroke-width", 2);
      d3.select("#" + ap.zone)
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "red");
    }
  }
}
