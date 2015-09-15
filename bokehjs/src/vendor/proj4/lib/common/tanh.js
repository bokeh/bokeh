module.exports = function(x) {
  var r = Math.exp(x);
  r = (r - 1 / r) / (r + 1 / r);
  return r;
};