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

module.exports =
  point_in_poly: point_in_poly
