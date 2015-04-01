angle_norm = (angle) ->
  while (angle < 0)
    angle += 2*Math.PI
  while (angle > 2*Math.PI)
    angle -= 2*Math.PI
  return angle

angle_dist = (lhs, rhs) ->
  return Math.abs(angle_norm(lhs-rhs))

angle_between = (mid, lhs, rhs, direction) ->
  mid = angle_norm(mid)
  d = angle_dist(lhs, rhs)
  if direction == "anticlock"
    return angle_dist(lhs, mid) <= d and angle_dist(mid, rhs) <= d
  else
    return not (angle_dist(lhs, mid) <= d and angle_dist(mid, rhs) <= d)

module.exports =
  angle_norm: angle_norm,
  angle_dist: angle_dist,
  angle_between: angle_between
