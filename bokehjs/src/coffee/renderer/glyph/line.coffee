define [
  "underscore"
  "./glyph"
], (_, Glyph) ->

  class LineView extends Glyph.View

    _index_data: () ->
      @_xy_index()

    _render: (ctx, indices) ->
      drawing = false
      @visuals.line.set_value(ctx)

      for i in indices
        if !isFinite(@sx[i] + @sy[i]) and drawing
          ctx.stroke()
          ctx.beginPath()
          drawing = false
          continue

        if drawing
          ctx.lineTo(@sx[i], @sy[i])
        else
          ctx.beginPath()
          ctx.moveTo(@sx[i], @sy[i])
          drawing = true

      if drawing
        ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Line extends Glyph.Model
    default_view: LineView
    type: 'Line'
    visuals: ['line']

  class Lines extends Glyph.Collection
    model: Line

  return {
    Model: Line
    View: LineView
    Collection: new Lines()
  }
