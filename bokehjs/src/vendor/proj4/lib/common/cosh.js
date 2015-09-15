module.exports = function(x) {
  var r = Math.exp(x);
  r = (r + 1 / r) / 2;
  return r;
};