var Animation = function () {
 this.timeSize = 100;
 this.left = -10;
 this.right = 90;
 this.updateSize = 1;
 moveSlider(this.right, 2);
 this.stop = false;
 this.notReady = false;
 this.day = 12;
 this.month = 11;
 this.year = 2015;

}

Animation.prototype.update = function() {
 if (this.notReady) return;
 this.left += this.updateSize;
 this.right += this.updateSize
 if (this.right >= 790) {
  this.newDay();
  return;
 }
 moveSlider(this.left, 1);
 moveSlider(this.right, 2);
 redraw();
}

Animation.prototype.newDay = function() {
 if (this.day == 30 && this.month == 11) {
  this.day = 1;
  this.month = 12;
 } else if (this.day == 31 && this.month == 12) {
  this.day = 1;
  this.month = 1;
  this.year = 2016;
 } else if (this.day == 31 && this.month == 1) {
  this.day = 1;
  this.month = 2;
 } else if (this.day == 29 && this.month == 2) {
  this.day = 1;
  this.month = 3;
 } else if (this.day == 9 && this.month == 3) {
  this.day = 12;
  this.month = 11;
  this.year = 15;
 } else {
 this.day += 1;
 }
 currDataName = this.month + "-" + this.day + "-" + this.year;
 currDate = this.month + "-" + this.day + "-" + (this.year-2000);
 weatherName = this.year + "-" + this.month + "-" + this.day;
 document.getElementById("theDate").textContent = currDataName;
 changeWeather();
 updateCounts();
 this.notReady = true;
 var self = this;
 if (isFlux) {
  var q = new Queue();
  flux.onReady(q.defer(function() {self.notReady = false}));
 }
 flux.loadDay(currDate);
 this.left = -10 - this.updateSize;
 this.right = 90 - this.updateSize;
 return;
}

Animation.prototype.start = function() {
 var self = this;
 this.interval = setInterval(function() {self.update()}, 60);
}

Animation.prototype.stop = function() {
  clearInterval(this.interval);
}

var moveSlider = function(pos, d) {
 $("#s" + d).css("left", pos);
  if (d == 1) {
   startTime = getTimeForSliderPosition(pos);
  } else {
   endTime = getTimeForSliderPosition(pos);
  }
  timeText.textContent = startTime + " - " + endTime;
  
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