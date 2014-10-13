define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class MultiLineView extends Glyph.View

    _fields: ['xs', 'ys']
    _properties: ['line']

    _render: (ctx, indices) ->
      for i in indices
        x = @xs[i]
        y = @ys[i]
        [sx, sy] = @renderer.map_to_screen(@xs[i], @glyph.xs.units, @ys[i], @glyph.ys.units)

        @props.line.set_vectorize(ctx, i)
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

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class MultiLine extends Glyph.Model
    default_view: MultiLineView
    type: 'MultiLine'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class MultiLines extends Glyph.Collection
    model: MultiLine

  return {
    Model: MultiLine
    View: MultiLineView
    Collection: new MultiLines()
  }
