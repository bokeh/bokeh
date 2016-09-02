_ = require "underscore"
rbush = require "rbush"

Glyph = require "./glyph"

class SegmentView extends Glyph.View

  _index_data: () ->
    index = rbush()
    pts = []
    for i in [0...@_x0.length]
      if not isNaN(@_x0[i] + @_x1[i] + @_y0[i] + @_y1[i])
        pts.push({
          minX: Math.min(@_x0[i], @_x1[i]),
          minY: Math.min(@_y0[i], @_y1[i]),
          maxX: Math.max(@_x0[i], @_x1[i]),
          maxY: Math.max(@_y0[i], @_y1[i]),
          i: i
        })
    index.load(pts)
    return index

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

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Segment extends Glyph.Model
  default_view: SegmentView

  type: 'Segment'

  @coords [['x0', 'y0'], ['x1', 'y1']]
  @mixins ['line']

module.exports =
  Model: Segment
  View: SegmentView
