/*
 * Map Class that takes in a JSON file of elements and handles drawing them to the SVG
 * svg: the svg element to add items to
 * projection: D3 projection
 */
var Map = function(svg, projection) {
    this.svg = svg;
    this.projection = projection;
    this.elems = ['grass', 'footways', 'streets', 'bldgs'];
    this.params = {};
    this.groups = [];
    for (var i in this.elems) this.params[this.elems[i]] = true;
    this.callbacks = [];
    this.dataLoaded = false;
    var self = this;
    d3.json("data/osm_map.json", function(error, json) {
    if (error) return console.warn(error);
    self.map = json;
    self.ready();
    this.dataLoaded = true;
  });
   this.line = d3.svg.line()
    .x(function(d) { return projection([d[1], d[0]])[0]})
    .y(function(d) { return projection([d[1], d[0]])[1]});
};

Map.prototype.clear = function() {
  for (var elem in this.groups) {
    elem = this.groups[elem];
    elem.remove();
  }
  this.groups = [];
}

/*
 * Draws the map to the svg
 * params (optional): a map of params to draw
 * order (optional): the order in which to draw elements
 */
Map.prototype.draw = function(params, order) {
 params = params || this.params;
 var self = this;
 elems = order || this.elems
 this.clear();
 for (var elem in elems) {
     elem = elems[elem];
     if (!this.params.hasOwnProperty(elem) || !params[elem]) continue;
     this.groups.push(svg.append("g").attr("id", "svg-" + elem).attr("class", elem).selectAll("g")
      .data(this.map[elem]).enter().append("path")
      .attr("d", function(d) { return self.line(d[1]); })
      .attr("id", function(d) { return d[0] }));
    }
};

Map.prototype.onReady = function(func) {
 this.callbacks.push(func);
 if (this.dataLoaded){
  this.ready();
 }
};

Map.prototype.ready = function() {
 this.callbacks.forEach(function(callback) {
  callback();
 });
 this.callbacks = [];
};

