var Flux = function(svg, projection, aps) {
 this.svg = svg;
 this.projection = projection;
 this.aps = aps;
 this.r1 = false;
 this.r2 = false;
 this.data = [];
 this.group = undefined;
 this.callbacks = [];
 this.fluxPaths = {};
 var self = this;
 this.maxFluxLines = 25;
 this.scale = Math.abs(projection.invert([0,0])[0] - projection.invert([2, 0])[0]);
 this.loadDay('11-12-15');
 this.threshold = 1;
 this.line = d3.svg.line()
    .interpolate("cardinal")
    .x(function(d) { return projection(d)[0]; })
    .y(function(d) { return projection(d)[1]; });
 d3.json('data/zone_paths.json', function(error, json) {
    if (error) return console.warn(error);
    for (var i in json) {
      var elem = json[i];
      self.fluxPaths[elem.source+elem.dest] = elem.points;
      rev_pts = [];
      for (var i in elem.points) {
        pt = elem.points[i];
        var dx = pt.slope_lng - pt.lng;
        var dy = pt.slope_lat - pt.lat;
        rev_pts.push ({
          lat: pt.lat,
          lng: pt.lng,
          slope_lat: pt.lat - dy,
          slope_lng: pt.lng - dx
        });
      }
      self.fluxPaths[elem.dest+elem.source] = rev_pts.reverse();
    }
    self.r2 = true;
    if (self.r1) self.ready();
 });
};

Flux.prototype.loadDay = function(day) {
 var path = 'data/flux/' + day + '.json';
 var self = this;
 this.r1 = false;
 this.data = [];
 d3.json(path, function(error, json) {
  if (error) return console.warn(error);
  for (var i in json) {
   ap_pair = json[i];
   self.data.push({
    source: ap_pair[0][0],
    dest: ap_pair[0][1],
    jumps: ap_pair[1].map(function(x) { return { disconnect: x[1], connect: x[2], mac: x[0] }; })
   });
  }
  self.r1 = true;
  if (self.r2) self.ready();
 });
};

Flux.prototype.onReady = function(func) {
 this.callbacks.push(func);
};

Flux.prototype.ready = function() {
 this.callbacks.forEach(function(callback) {
  callback();
 });
 this.callbacks = [];
};

Flux.prototype.flux = function(start, end) {
 var zone_weights = [];
 if (this.group != undefined) {
  this.group.remove();
 }
 var self = this;
 var maxInGroup = 0;
 for (var i in this.data) {
  var ap_pair = this.data[i];
  var new_jumps = ap_pair.jumps.filter(function(d) { return d.disconnect > start && d.connect < end; });
  if (new_jumps.length >= this.threshold) {
    if (new_jumps.length > maxInGroup) maxInGroup = new_jumps.length;
    var source = aps.getZoneByName(ap_pair.source);
    var dest = aps.getZoneByName(ap_pair.dest);
    zone_weights.push( {
    paths: new_jumps,
    source: source,
    dest: dest
  });
  }
 }
 var normFactor = 1;
 if (maxInGroup > this.maxFluxLines) {
  normFactor = this.maxFluxLines / maxInGroup; 
 }
 var paths = [];
 zone_weights.map(function (w) {
  var numPaths = Math.floor(w.paths.length * normFactor); 
  for (var i = 0; i < numPaths; i ++) {
    paths.push({
      path: self.createFluxPath(w.source, w.dest, i),
      zone: w.source,
      dest: w.dest,
      mac: w.paths[i].mac
  });
  }
});

 this.group = this.svg.append("g").attr("class", "flux-paths")
 this.group.selectAll("g")
 .data(paths).enter().append("path")
 .attr("d", function(d) { return self.line(d.path); })
 .attr("class", function(d) { return d.zone.zone + '-path' ;})
 .attr("stroke", function(d) { return d.zone.color } )
 .attr("data-dest", function(d) { return d.dest.zone})
 .attr("data-mac", function(d) { return d.mac });
 this.aps.draw();
};
Flux.prototype.createFluxPath = function(source, dest, idx) {
  var pathSpec = this.fluxPaths[source.zone + dest.zone];
  if (!pathSpec) return this.createFluxPathNoSetPts(source, dest, idx);
  var path = [[source.lng, source.lat]];
  for (var ptIdx in pathSpec) {
    var pathPt = pathSpec[ptIdx];
    var lat = pathPt.lat;
    var lng = pathPt.lng;
    var slope = (lat - pathPt.slope_lat) / (lng - pathPt.slope_lng);
    if (slope > 13) {
      x = lng;
      y = lat - this.scale;
      if (Math.abs(pathPt.slope_lat - lat) < Math.abs(pathPt.slope_lat - y)) y = lat + this.scale;
      path.push([x, y]);
      continue;
    }
    var displacement_sq = Math.pow(this.scale * (idx + 1), 2);
    var a = 1 + Math.pow(slope, 2);
    var b = -2 * lng - 2 * Math.pow(slope, 2) * lng;
    var c = Math.pow(lng, 2) + Math.pow(slope, 2) * Math.pow(lng, 2) - displacement_sq;
    var x = (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
    var y = slope * x - slope * lng + lat;
    var distToRef = Math.pow(lat - pathPt.slope_lat, 2) + Math.pow(lng - pathPt.slope_lng, 2);
    var distToPt = Math.pow(y - pathPt.slope_lat, 2) + Math.pow(x - pathPt.slope_lng, 2);
    if (distToPt > distToRef) {
      x = (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
      y = slope * x - slope * lng + lat;
    }
    path.push([x, y]);
  }
  path.push([dest.lng, dest.lat]);
  return path;
};

Flux.prototype.createFluxPathNoSetPts = function(source, dest, idx) {
  var midLat = (source.lat + dest.lat) / 2;
  var midLng = (source.lng + dest.lng) / 2;
  var range = Math.sqrt(Math.pow((source.lat - dest.lat), 2), Math.pow((source.lng - dest.lng), 2));
  var slope = -1 / ((source.lat - dest.lat) / (source.lng - dest.lng));
  range /= 50;
  range *= idx + 5;
  var displacement_sq = Math.pow(this.scale * (idx + 5), 2);
  var a = 1 + Math.pow(slope, 2);
  var b = -2 * midLng - 2 * Math.pow(slope, 2) * midLng;
  var c = Math.pow(midLng, 2) + Math.pow(slope, 2) * Math.pow(midLng, 2) - displacement_sq;
  var x = (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
  var y = slope * x - slope * midLng + midLat;

  return [[source.lng, source.lat], [x, y], [dest.lng, dest.lat]];
}