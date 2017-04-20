import * as hittest from "core/hittest"
import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"

export class SegmentView extends GlyphView

  _index_data: () ->
    points = []
    for i in [0...@_x0.length]
      if not isNaN(@_x0[i] + @_x1[i] + @_y0[i] + @_y1[i])
        points.push({
          minX: Math.min(@_x0[i], @_x1[i]),
          minY: Math.min(@_y0[i], @_y1[i]),
          maxX: Math.max(@_x0[i], @_x1[i]),
          maxY: Math.max(@_y0[i], @_y1[i]),
          i: i
        })

    return new RBush(points)

  _render: (ctx, indices, {sx0, sy0, sx1, sy1}) ->
    if @visuals.line.doit
      for i in indices
        if isNaN(sx0[i]+sy0[i]+sx1[i]+sy1[i])
          continue

        ctx.beginPath()
        ctx.moveTo(sx0[i], sy0[i])
        ctx.lineTo(sx1[i], sy1[i])

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  _hit_point: (geometry) ->
    [vx, vy] = [geometry.vx, geometry.vy]
    x = @renderer.xmapper.map_from_target(vx, true)
    y = @renderer.ymapper.map_from_target(vy, true)

    threshold = Math.max(2, @visuals.line.line_width.value() / 2)

    point =
      x: this.renderer.plot_view.canvas.vx_to_sx(vx)
      y: this.renderer.plot_view.canvas.vy_to_sy(vy)

    hits = []

    candidates = @index.indices({minX: x, minY: y, maxX: x, maxY: y})
    for i in candidates
      [p0, p1] = [{x: @sx0[i], y: @sy0[i]}, {x: @sx1[i], y: @sy1[i]}]
      dist = hittest.dist_to_segment(point, p0, p1)
      if dist < threshold
        hits.push(i)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  _hit_span: (geometry) ->
    hr = @renderer.plot_view.frame.h_range
    vr = @renderer.plot_view.frame.v_range

    [vx, vy] = [geometry.vx, geometry.vy]

    if geometry.direction == 'v'
      val = @renderer.ymapper.map_from_target(vy)
      [v0, v1] = [@_y0, @_y1]
    else
      val = @renderer.xmapper.map_from_target(vx)
      [v0, v1] = [@_x0, @_x1]

    hits = []

    candidates = @index.indices({
      minX: @renderer.xmapper.map_from_target(hr.min),
      minY: @renderer.ymapper.map_from_target(vr.min),
      maxX: @renderer.xmapper.map_from_target(hr.max),
      maxY: @renderer.ymapper.map_from_target(vr.max)
    })
    console.log (candidates)
    for i in candidates
      if v0[i]<=val<=v1[i] or v1[i]<=val<=v0[i]
        hits.push(i)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  scx: (i) ->
    return (@sx0[i] + @sx1[i])/2

  scy: (i) ->
    return (@sy0[i] + @sy1[i])/2

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1, index)

export class Segment extends Glyph
  default_view: SegmentView

  type: 'Segment'

  @coords [['x0', 'y0'], ['x1', 'y1']]
  @mixins ['line']
