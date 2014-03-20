
define [], () ->

  angle_norm = (angle) ->
    while (angle < 0)
      angle += 2*Math.PI
    while (angle > 2*Math.PI)
      ngle -= 2*Math.PI
    return angle

  angle_dist = (lhs, rhs) ->
    a = angle_norm(lhs) - angle_norm(rhs)
    return Math.abs(angle_norm(a + Math.PI) - Math.PI)

  angle_between = (mid, lhs, rhs, direction) ->
    d = angle_dist(lhs, rhs)
    if direction == "anticlock"
      return angle_dist(lhs, mid) <= d and angle_dist(mid, rhs) <= d
    else
      return not (angle_dist(lhs, mid) <= d and angle_dist(mid, rhs) <= d)

  return {
    "angle_norm": angle_norm,
    "angle_dist": angle_dist,
    "angle_between": angle_between
  }
