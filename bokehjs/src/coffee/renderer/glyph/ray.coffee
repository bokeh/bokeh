define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class RayView extends Glyph.View

    _fields: ['x', 'y', 'angle', 'length']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)
      @length = @distance_vector('x', 'length', 'edge')

      width = @renderer.plot_view.frame.get('width')
      height = @renderer.plot_view.frame.get('height')
      inf_len = 2 * (width + height)
      for i in [0...@length.length]
        if @length[i] == 0 then @length[i] = inf_len

    _render: (ctx, indices) ->
      if @props.line.do_stroke
        for i in indices
          if isNaN(@sx[i] + @sy[i] + @angle[i] + @length[i])
            continue

          ctx.translate(@sx[i], @sy[i])
          ctx.rotate(@angle[i])

          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(@length[i], 0)

          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

          ctx.rotate(-@angle[i])
          ctx.translate(-@sx[i], -@sy[i])

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Ray extends Glyph.Model
    default_view: RayView
    type: 'Ray'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class Rays extends Glyph.Collection
    model: Ray

  return {
    Model: Ray
    View: RayView
    Collection: new Rays()
  }
