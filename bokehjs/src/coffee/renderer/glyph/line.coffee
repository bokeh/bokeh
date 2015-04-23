_ = require "underscore"
Glyph = require "./glyph"
hittest = require "../../common/hittest"

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
    result = hittest.create_hit_test_result()
    point = {x: x, y: y}
    shortest = 100
    threshold = 1

    for i in [0...@x.length-1]
      [p0, p1] = [{x: @x[i], y: @y[i]}, {x: @x[i+1], y: @y[i+1]}]
      dist = hittest.dist_to_segment(point, p0, p1)

      if dist < threshold && dist < shortest
        shortest = dist
        result['0d'].flag = true
        result['0d'].indices = [i]

    return result

  _hit_span: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    result = hittest.create_hit_test_result()

    if geometry.direction == 'v'
      val = @renderer.ymapper.map_from_target(vy)
      values = @y
    else
      val = @renderer.xmapper.map_from_target(vx)
      values = @x

    for i in [0...values.length-1]
      if values[i]<=val<=values[i+1]
        result['0d'].flag = true
        result['0d'].indices.push(i)

    return result

  get_interpolation_hit: (i, geometry)->
    [vx, vy] = [geometry.vx, geometry.vy]
    [x2, y2, x3, y3] = [@x[i], @y[i], @x[i+1], @y[i+1]]

    if geometry.type == 'point'
      [y0, y1] = @renderer.ymapper.v_map_from_target([vy-1, vy+1])
      [x0, x1] = @renderer.xmapper.v_map_from_target([vx-1, vx+1])
    else
      if geometry.direction == 'v'
        [y0, y1] = @renderer.ymapper.v_map_from_target([vy, vy])
        [x0, x1] = [x2, x3]
      else
        [x0, x1] = @renderer.xmapper.v_map_from_target([vx, vx])
        [y0, y1] = [y2, y3]

    res = hittest.check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3)
    return [res.x, res.y]

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Line extends Glyph.Model
  default_view: LineView
  type: 'Line'
  visuals: ['line']

module.exports =
  Model: Line
  View: LineView