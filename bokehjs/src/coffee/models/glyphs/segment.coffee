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
    {sx, sy} = geometry
    x = @renderer.xscale.invert(sx)
    y = @renderer.yscale.invert(sy)

    point = {x: sx, y: sy}

    hits = []
    lw_voffset = 2 # FIXME: Use maximum of segments line_width/2 instead of magic constant 2
    candidates = @index.indices({
      minX: @renderer.xscale.invert(sx-lw_voffset),
      minY: @renderer.yscale.invert(sy-lw_voffset),
      maxX: @renderer.xscale.invert(sx+lw_voffset),
      maxY: @renderer.yscale.invert(sy+lw_voffset),
    })

    for i in candidates
      threshold2 = Math.pow(Math.max(2, @visuals.line.cache_select('line_width', i) / 2), 2)
      [p0, p1] = [{x: @sx0[i], y: @sy0[i]}, {x: @sx1[i], y: @sy1[i]}]
      dist2 = hittest.dist_to_segment_squared(point, p0, p1)
      if dist2 < threshold2
        hits.push(i)

    result = hittest.create_hit_test_result()
    result['1d'].indices = hits
    return result

  _hit_span: (geometry) ->
    [hr, vr] = @renderer.plot_view.frame.bbox.ranges
    {sx, sy} = geometry

    if geometry.direction == 'v'
      val = @renderer.yscale.invert(sy)
      [v0, v1] = [@_y0, @_y1]
    else
      val = @renderer.xscale.invert(sx)
      [v0, v1] = [@_x0, @_x1]

    hits = []

    candidates = @index.indices({
      minX: @renderer.xscale.invert(hr.start),
      minY: @renderer.yscale.invert(vr.start),
      maxX: @renderer.xscale.invert(hr.end),
      maxY: @renderer.yscale.invert(vr.end),
    })

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
