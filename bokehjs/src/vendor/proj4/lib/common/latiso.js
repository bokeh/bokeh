var HALF_PI = Math.PI/2;

module.exports = function(eccent, phi, sinphi) {
  if (Math.abs(phi) > HALF_PI) {
    return Number.NaN;
  }
  if (phi === HALF_PI) {
    return Number.POSITIVE_INFINITY;
  }
  if (phi === -1 * HALF_PI) {
    return Number.NEGATIVE_INFINITY;
  }

  var con = eccent * sinphi;
  return Math.log(Math.tan((HALF_PI + phi) / 2)) + eccent * Math.log((1 - con) / (1 + con)) / 2;
};