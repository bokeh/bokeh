import {RBush} from "core/util/spatial"
import {Glyph, GlyphView} from "./glyph"

# Formula from: http://pomax.nihongoresources.com/pages/bezier/
#
# if segment is quadratic bezier do:
#   for both directions do:
#     if control between start and end, compute linear bounding box
#     otherwise, compute
#       bound = u(1-t)^2 + 2v(1-t)t + wt^2
#         (with t = ((u-v) / (u-2v+w)), with {u = start, v = control, w = end})
#       if control precedes start, min = bound, otherwise max = bound

_qbb = (u, v, w) ->
  if v == (u+w)/2
    return [u, w]
  else
    t = (u-v) / (u-2*v+w)
    bd = u*Math.pow((1-t), 2) + 2*v*(1-t)*t + w*Math.pow(t, 2)
    return [Math.min(u, w, bd), Math.max(u, w, bd)]

export class QuadraticView extends GlyphView

  _index_data: () ->
    points = []
    for i in [0...@_x0.length]
      if isNaN(@_x0[i] + @_x1[i] + @_y0[i] + @_y1[i] + @_cx[i] + @_cy[i])
        continue

      [x0, x1] = _qbb(@_x0[i], @_cx[i], @_x1[i])
      [y0, y1] = _qbb(@_y0[i], @_cy[i], @_y1[i])

      points.push({minX: x0, minY: y0, maxX: x1, maxY: y1, i: i})

    return new RBush(points)

  _render: (ctx, indices, {sx0, sy0, sx1, sy1, scx, scy}) ->
    if @visuals.line.doit
      for i in indices
        if isNaN(sx0[i]+sy0[i]+sx1[i]+sy1[i]+scx[i]+scy[i])
          continue

        ctx.beginPath()
        ctx.moveTo(sx0[i], sy0[i])
        ctx.quadraticCurveTo(scx[i], scy[i], sx1[i], sy1[i])

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  draw_legend_for_index: (ctx, x0, x1, y0, y1, index) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1, index)

export class Quadratic extends Glyph
  default_view: QuadraticView

  type: 'Quadratic'

  @coords [['x0', 'y0'], ['x1', 'y1'], ['cx', 'cy']]
  @mixins ['line']
