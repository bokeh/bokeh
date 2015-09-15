var adjust_lon = require('../common/adjust_lon');
exports.init = function() {
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.lat0 = this.lat0 || 0;
  this.long0 = this.long0 || 0;
  ///this.t2;
};



/* Equirectangular forward equations--mapping lat,long to x,y
  ---------------------------------------------------------*/
exports.forward = function(p) {

  var lon = p.x;
  var lat = p.y;

  var dlon = adjust_lon(lon - this.long0);
  var x = this.x0 + this.a * dlon * Math.cos(this.lat0);
  var y = this.y0 + this.a * lat;

  this.t1 = x;
  this.t2 = Math.cos(this.lat0);
  p.x = x;
  p.y = y;
  return p;
};



/* Equirectangular inverse equations--mapping x,y to lat/long
  ---------------------------------------------------------*/
exports.inverse = function(p) {

  p.x -= this.x0;
  p.y -= this.y0;
  var lat = p.y / this.a;

  var lon = adjust_lon(this.long0 + p.x / (this.a * Math.cos(this.lat0)));
  p.x = lon;
  p.y = lat;
};
exports.names = ["equi"];
