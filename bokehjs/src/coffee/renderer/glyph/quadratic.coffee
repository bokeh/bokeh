_ = require "underscore"
rbush = require "rbush"
Glyph = require "./glyph"

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

class QuadraticView extends Glyph.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@x0.length]
      if isNaN(@x0[i] + @x1[i] + @y0[i] + @y1[i] + @cx[i] + @cy[i])
        continue

      [x0, x1] = _qbb(@x0[i], @cx[i], @x1[i])
      [y0, y1] = _qbb(@y0[i], @cy[i], @y1[i])

      pts.push([x0, y0, x1, y1, {'i': i}])

    index.load(pts)
    return index

  _render: (ctx, indices, {sx0, sy0, sx1, sy1, scx, scy}) ->
    if @visuals.line.do_stroke
      for i in indices
        if isNaN(sx0[i]+sy0[i]+sx1[i]+sy1[i]+scx[i]+scy[i])
          continue

        ctx.beginPath()
        ctx.moveTo(sx0[i], sy0[i])
        ctx.quadraticCurveTo(scx[i], scy[i], sx1[i], sy1[i])

        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Quadratic extends Glyph.Model
  default_view: QuadraticView
  type: 'Quadratic'
  visuals: ['line']
  coords: [ ['x0', 'y0'], ['x1', 'y1'], ['cx', 'cy'] ]

module.exports =
  Model: Quadratic
  View: QuadraticView