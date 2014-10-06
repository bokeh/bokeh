define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class SegmentView extends Glyph.View

    _fields: ['x0', 'y0', 'x1', 'y1']
    _properties: ['line']

    _map_data: () ->
      [@sx0, @sy0] = @renderer.map_to_screen(@x0, @glyph.x0.units, @y0, @glyph.y0.units)
      [@sx1, @sy1] = @renderer.map_to_screen(@x1, @glyph.x1.units, @y1, @glyph.y1.units)

    _render: (ctx, indices) ->
      if @props.line.do_stroke
        for i in indices
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.lineTo(@sx1[i], @sy1[i])

          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Segment extends Glyph.Model
    default_view: SegmentView
    type: 'Segment'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class Segments extends Glyph.Collection
    model: Segment

  return {
    Model: Segment
    View: SegmentView
    Collection: new Segments()
  }
