_ = require "underscore"
Glyph = require "./glyph"

class LineView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _render: (ctx, indices, {sx, sy}) ->
    drawing = false
    @visuals.line.set_value(ctx)

    for i in indices
      if !isFinite(sx[i]+sy[i]) and drawing
        ctx.stroke()
        ctx.beginPath()
        drawing = false
        continue

      if drawing
        ctx.lineTo(sx[i], sy[i])
      else
        ctx.beginPath()
        ctx.moveTo(sx[i], sy[i])
        drawing = true

    if drawing
      ctx.stroke()

  _hit_point: (geometry) ->
    ### Check if the point geometry hits this line glyph and return an object
    that describes the hit result:
      Args:
        * geometry (object): object with the following keys
          * vx (float): view x coordinate of the point
          * vy (float): view y coordinate of the point
          * type (str): type of geometry (in this case it's a point)
      Output:
        Object with the following keys:
          * 0d (bool): whether the point hits the glyph or not
          * 1d (array(int)): array with the indices hit by the point
    ###
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx)
    y = @renderer.ymapper.map_from_target(vy)
    result = {
      '0d': {flag: false, indices: []},
      '1d': {indices: []}
    }
    point = {x: x, y: y}
    shortest = 100
    threshold = 1

    for i in [0...@x.length-1]
      [p0, p1] = [{x: @x[i], y: @y[i]}, {x: @x[i+1], y: @y[i+1]}]
      dist = dist_to_segment(point, p0, p1)

      if dist < threshold && dist < shortest
        shortest = dist
        result['0d'].flag = true
        result['0d'].indices = [i]
        if dist_2_pts(point, p0) < dist_2_pts(point, p1)
          result['1d'].indices = [i]
        else
          result['1d'].indices = [i]

    return result

  _hit_span: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    result = {
      '0d': {flag: false, indices: []},
      '1d': {indices: []}
    }

    if geometry.direction == 'h'
      val = @renderer.ymapper.map_from_target(vy)
      values = @y
    else
      val = @renderer.xmapper.map_from_target(vx)
      values = @x

    for i in [0...values.length-1]
      if values[i]<=val<=values[i+1]
        result['0d'].flag = true
        result['0d'].indices.push(i)
        if Math.abs values[i]-val <= Math.abs values[i+1]-val
          result['1d'].indices.push(i)
        else
          result['1d'].indices.push(i+1)

    return result

  get_interpolation_hit: (i, geometry)->
    [vx, vy] = [geometry.vx, geometry.vy]
    [x2, y2, x3, y3] = [@x[i], @y[i], @x[i+1], @y[i+1]]

    if geometry.type == 'point'
    else
      if geometry.direction == 'h'
        [y0, y1] = @renderer.ymapper.v_map_from_target([vy, vy])
        [x0, x1] = [x2, x3]
      else
        [x0, x1] = @renderer.xmapper.v_map_from_target([vx, vx])
        [y0, y1] = [y2, y3]

    return check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3)

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Line extends Glyph.Model
  default_view: LineView
  type: 'Line'
  visuals: ['line']

module.exports =
  Model: Line
  View: LineView

sqr = (x) -> x * x
dist_2_pts = (v, w) -> sqr(v.x - w.x) + sqr(v.y - w.y)
dist_to_segment_squared = (p, v, w) ->
  l2 = dist_2_pts(v, w)
  if (l2 == 0)
    return dist_2_pts(p, v)
  t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  if (t < 0)
    return dist_2_pts(p, v)
  if (t > 1)
    return dist_2_pts(p, w)

  return dist_2_pts(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) })
dist_to_segment = (p, v, w) -> Math.sqrt dist_to_segment_squared(p, v, w)
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