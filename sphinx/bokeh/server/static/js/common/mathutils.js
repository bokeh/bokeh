(function() {
  define([], function() {
    var angle_between, angle_dist, angle_norm;
    angle_norm = function(angle) {
      while (angle < 0) {
        angle += 2 * Math.PI;
      }
      while (angle > 2 * Math.PI) {
        angle -= 2 * Math.PI;
      }
      return angle;
    };
    angle_dist = function(lhs, rhs) {
      return Math.abs(angle_norm(lhs - rhs));
    };
    angle_between = function(mid, lhs, rhs, direction) {
      var d;
      mid = angle_norm(mid);
      d = angle_dist(lhs, rhs);
      if (direction === "anticlock") {
        return angle_dist(lhs, mid) <= d && angle_dist(mid, rhs) <= d;
      } else {
        return !(angle_dist(lhs, mid) <= d && angle_dist(mid, rhs) <= d);
      }
    };
    return {
      "angle_norm": angle_norm,
      "angle_dist": angle_dist,
      "angle_between": angle_between
    };
  });

}).call(this);

/*
//@ sourceMappingURL=mathutils.js.map
*/