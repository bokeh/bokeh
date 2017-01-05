export array_min = (arr) ->
  len = arr.length
  min = Infinity
  while len--
    val = arr[len]
    if val < min
      min = val
  min

export array_max = (arr) ->
  len = arr.length
  max = -Infinity
  while len--
    val = arr[len]
    if val > max
      max = val
  max

export angle_norm = (angle) ->
  while (angle < 0)
    angle += 2*Math.PI
  while (angle > 2*Math.PI)
    angle -= 2*Math.PI
  return angle

export angle_dist = (lhs, rhs) ->
  return Math.abs(angle_norm(lhs-rhs))

export angle_between = (mid, lhs, rhs, direction) ->
  mid = angle_norm(mid)
  d = angle_dist(lhs, rhs)
  if direction == "anticlock"
    return angle_dist(lhs, mid) <= d and angle_dist(mid, rhs) <= d
  else
    return not (angle_dist(lhs, mid) <= d and angle_dist(mid, rhs) <= d)

export random = () ->
  return Math.random()

export atan2 = (start, end) ->
  """
  Calculate the angle between a line containing start and end points (composed
  of [x, y] arrays) and the positive x-axis.
  """
  return Math.atan2(end[1]-start[1], end[0]-start[0])


# http://www2.econ.osaka-u.ac.jp/~tanizaki/class/2013/econome3/13.pdf (Page 432)
export rnorm = (mu, sigma) ->
  # Generate a random normal with a mean of 0 and a sigma of 1
  r1 = null
  r2 = null
  loop
    r1 = random()
    r2 = random()
    r2 = (2*r2-1)*Math.sqrt(2*(1/Math.E))
    break if -4*r1*r1*Math.log(r1) >= r2*r2
  rn = r2/r1

  # Transform the standard normal to meet the characteristics that we want (mu, sigma)
  rn = mu + sigma*rn

  return rn

export clamp = (val, min, max) ->
  if val > max
    return max
  if val < min
    return min
  return val
