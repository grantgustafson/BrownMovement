var Queue = function() {
    this.queue = [];
}

Queue.prototype.defer = function(releaseF) {
   var elem = {
    onRelease: releaseF,
    ready: false,
    released: false
   };
   this.queue.push(elem);
   var self = this;
   var idx = this.queue.length - 1;
   var f = function() {self.release(idx);}
   return f;
}


Queue.prototype.release = function(idx) {
 if (idx >= this.queue.length) return console.log("Error: item to release doesn't exist");
 this.queue[idx].ready = true;
 for (var i in this.queue) {
  var elem = this.queue[i];
  if (!elem.ready) break;
  if (elem.released) continue;
  elem.onRelease();
  elem.released = true;
 }
};