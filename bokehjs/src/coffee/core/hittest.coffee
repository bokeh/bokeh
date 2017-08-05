import {union, concat, sortBy} from "./util/array"
import {merge} from "./util/object"

export point_in_poly = (x, y, px, py) ->
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

nullreturner = () -> null  # stub function shared by all hittests by default

export class HitTestResult
  constructor: () ->
    # 0d is only valid for line and patch glyphs
    @['0d'] = {
      # the glyph that was picked
      glyph: null,
      get_view: nullreturner,  # this is a function, because setting the view causes inf. recursion
      # array with the [smallest] index of the segment of the line that was hit
      indices: []
    }
    # 1d for all other glyphs apart from multilines and multi patches
    @['1d'] = {
      # index of the closest point to the crossed segment
      # useful for special glyphs like line that are continuous and
      # not discrete between 2 data points
      indices: []
    }
    # 2d for all for multilines and multi patches
    @['2d'] = {
      # mapping of indices of the multiglyph to array of glyph indices that were hit
      # e.g. {3: [5, 6], 4, [5]}
      indices: {}
    }

  Object.defineProperty(this.prototype, '_0d', { get: () -> @['0d'] })
  Object.defineProperty(this.prototype, '_1d', { get: () -> @['1d'] })
  Object.defineProperty(this.prototype, '_2d', { get: () -> @['2d'] })

  is_empty: () ->
    @_0d.indices.length == 0 && @_1d.indices.length == 0 && Object.keys(@_2d.indices).length == 0

  update_through_union: (other) ->
    @['0d'].indices = union(other['0d'].indices, @['0d'].indices)
    @['0d'].glyph = other['0d'].glyph or @['0d'].glyph
    @['1d'].indices = union(other['1d'].indices, @['1d'].indices)
    @['2d'].indices = merge(other['2d'].indices, @['2d'].indices)

export create_hit_test_result = () -> new HitTestResult()

export create_1d_hit_test_result = (hits) ->
  result = new HitTestResult()
  result['1d'].indices = (i for [i, _dist] in sortBy(hits, ([_i, dist]) -> dist))
  return result

export validate_bbox_coords = ([x0, x1], [y0, y1]) ->
  # rbush expects x0, y0 to be min, x1, y1 max
  if x0 > x1 then [x0, x1] = [x1, x0]
  if y0 > y1 then [y0, y1] = [y1, y0]
  return {minX: x0, minY: y0, maxX: x1, maxY: y1}

sqr = (x) -> x * x
export dist_2_pts = (vx, vy, wx, wy) -> sqr(vx - wx) + sqr(vy - wy)

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

export dist_to_segment = (p, v, w) ->
  Math.sqrt dist_to_segment_squared(p, v, w)

export check_2_segments_intersect = (l0_x0, l0_y0, l0_x1, l0_y1, l1_x0, l1_y0, l1_x1, l1_y1) ->
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
