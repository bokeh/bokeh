var HALF_PI = Math.PI/2;
var sign = require('./sign');

module.exports = function(x) {
  return (Math.abs(x) < HALF_PI) ? x : (x - (sign(x) * Math.PI));
};