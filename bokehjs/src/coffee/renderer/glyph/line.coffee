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

  draw_legend: (ctx, x0, x1, y0, y1) ->
    @_generic_line_legend(ctx, x0, x1, y0, y1)

class Line extends Glyph.Model
  default_view: LineView
  type: 'Line'
  visuals: ['line']

module.exports =
  Model: Line
  View: LineView