import {RBush} from "core/util/spatial"
import * as hittest from "core/hittest"
import {min, max} from "core/util/array"
import {isStrictNaN} from "core/util/types"
import {Glyph, GlyphView} from "./glyph"

export class MultiLineView extends GlyphView

  _index_data: () ->
    points = []
    for i in [0...@_xs.length]
      if @_xs[i] == null or @_xs[i].length == 0
        continue
      xs = (x for x in @_xs[i] when not isStrictNaN(x))
      ys = (y for y in @_ys[i] when not isStrictNaN(y))
      points.push({
        minX: min(xs),
        minY: min(ys),
        maxX: max(xs),
        maxY: max(ys),
        i: i
      })

    return new RBush(points)

  _render: (ctx, indices, {sxs, sys}) ->
    for i in indices
      [sx, sy] = [sxs[i], sys[i]]

      @visuals.line.set_vectorize(ctx, i)
      for j in [0...sx.length]
        if j == 0
          ctx.beginPath()
          ctx.moveTo(sx[j], sy[j])
          continue
        else if isNaN(sx[j]) or isNaN(sy[j])
          ctx.stroke()
          ctx.beginPath()
          continue
        else
          ctx.lineTo(sx[j], sy[j])
      ctx.stroke()

  _hit_point: (geometry) ->
    result = hittest.create_hit_test_result()
    point = {x: geometry.sx, y: geometry.sy}
    shortest = 9999

    hits = {}
    for i in [0...@sxs.length]
      threshold = Math.max(2, @visuals.line.cache_select('line_width', i) / 2)
      points = null
      for j in [0...@sxs[i].length-1]
        [p0, p1] = [{x: @sxs[i][j], y: @sys[i][j]}, {x: @sxs[i][j+1], y: @sys[i][j+1]}]
        dist = hittest.dist_to_segment(point, p0, p1)
        if dist < threshold && dist < shortest
          shortest = dist
          points = [j]
      if points
        hits[i] = points

    result['1d'].indices = (parseInt(i) for i in Object.keys(hits))
    result['2d'].indices = hits

    return result

  _hit_span: (geometry) ->
    {sx, sy} = geometry
    result = hittest.create_hit_test_result()

    if geometry.direction == 'v'
      val = @renderer.yscale.invert(sy)
      values = @_ys
    else
      val = @renderer.xscale.invert(sx)
      values = @_xs

    hits = {}
    for i in [0...values.length]
      points = []
      for j in [0...values[i].length-1]
        if values[i][j] <= val <= values[i][j+1]
          points.push(j)
      if points.length > 0
        hits[i] = points

    result['1d'].indices = (parseInt(i) for i in Object.keys(hits))
    result['2d'].indices = hits

    return result

  get_interpolation_hit: (i, point_i, geometry)->
    {sx, sy} = geometry
    [x2, y2, x3, y3] = [@_xs[i][point_i], @_ys[i][point_i], @_xs[i][point_i+1], @_ys[i][point_i+1]]

    if geometry.type == 'point'
      [y0, y1] = @renderer.yscale.r_invert(sy-1, sy+1)
      [x0, x1] = @renderer.xscale.r_invert(sx-1, sx+1)
    else
      if geometry.direction == 'v'
        [y0, y1] = @renderer.yscale.r_invert(sy, sy)
        [x0, x1] = [x2, x3]
      else
        [x0, x1] = @renderer.xscale.r_invert(sx, sx)
        [y0, y1] = [y2, y3]

    res = hittest.check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3)
    return [res.x, res.y]

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1, index)

export class MultiLine extends Glyph
  default_view: MultiLineView

  type: 'MultiLine'

  @coords [['xs', 'ys']]
  @mixins ['line']
