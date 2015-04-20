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

module.exports =
  point_in_poly: point_in_poly
  create_hit_test_result: create_hit_test_result
  dist_2_pts: dist_2_pts
