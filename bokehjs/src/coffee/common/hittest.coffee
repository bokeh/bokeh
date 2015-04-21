point_in_poly = (x, y, px, py) ->
  inside = false

  x1 = px[px.length-1]
  y1 = py[py.length-1]

  for i in [0...px.length]
    x2 = px[i]
    y2 = py[i]
    if ( y1 < y ) != ( y2 < y )
      if x1 + ( y - y1 ) / ( y2 - y1 ) * ( x2 - x1 ) < x
        inside = not inside
    x1 = x2
    y1 = y2

  return inside

create_hit_test_result = ->
  result = {
    # 0d is only valid for line and patch glyphs
    '0d': {
      # boolean flag to indicate if the glyph was hit or not
      flag: false,
      # array with the [smallest] index of the segment of the line that was hit
      indices: []
    }
    # 1d for all other glyphs apart from multilines and multi patches
    '1d': {
      # index of the closest point to the crossed segment
      # useful for special glypth like line that are continuous and
      # not discrete between 2 data points
      indices: []
    }
    # 2d for all for multilines and multi patches
    '2d': {indices: []}
  }

  return result

sqr = (x) -> x * x
dist_2_pts = (vx, vy, wx, wy) -> sqr(vx - wx) + sqr(vy - wy)

dist_to_segment_squared = (p, v, w) ->
  l2 = dist_2_pts(v.x, v.y, w.x, w.y)
  if (l2 == 0)
    return dist_2_pts(p.x, p.y, v.x, v.y)
  t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  if (t < 0)
    return dist_2_pts(p.x, p.y, v.x, v.y)
  if (t > 1)
    return dist_2_pts(p.x, p.y, w.x, w.y)

  return dist_2_pts(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y))

dist_to_segment = (p, v, w) ->
  Math.sqrt dist_to_segment_squared(p, v, w)

check_2_segments_intersect = (l0_x0, l0_y0, l0_x1, l0_y1, l1_x0, l1_y0, l1_x1, l1_y1) ->
  ### Check if 2 segments (l0 and l1) intersect. Returns a structure with
    the following attributes:
      * hit (boolean): whether the 2 segments intersect
      * x (float): x coordinate of the intersection point
      * y (float): y coordinate of the intersection point
  ###
  den = ((l1_y1 - l1_y0) * (l0_x1 - l0_x0)) - ((l1_x1 - l1_x0) * (l0_y1 - l0_y0))

  if den == 0
    return {hit: false, x: null, y: null}
  else
    a = l0_y0 - l1_y0
    b = l0_x0 - l1_x0
    num1 = ((l1_x1 - l1_x0) * a) - ((l1_y1 - l1_y0) * b)
    num2 = ((l0_x1 - l0_x0) * a) - ((l0_y1 - l0_y0) * b)
    a = num1 / den
    b = num2 / den
    x = l0_x0 + (a * (l0_x1 - l0_x0))
    y = l0_y0 + (a * (l0_y1 - l0_y0))

    return {
      hit: (a > 0 && a < 1) && (b > 0 && b < 1),
      x: x,
      y: y
    }

module.exports =
  point_in_poly: point_in_poly
  create_hit_test_result: create_hit_test_result
  dist_2_pts: dist_2_pts
  dist_to_segment: dist_to_segment
  check_2_segments_intersect: check_2_segments_intersect
