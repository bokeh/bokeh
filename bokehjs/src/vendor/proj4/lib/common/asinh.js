module.exports = function(x) {
  var s = (x >= 0 ? 1 : -1);
  return s * (Math.log(Math.abs(x) + Math.sqrt(x * x + 1)));
};