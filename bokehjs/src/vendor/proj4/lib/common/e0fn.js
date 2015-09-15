module.exports = function(x) {
  return (1 - 0.25 * x * (1 + x / 16 * (3 + 1.25 * x)));
};