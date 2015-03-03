define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class LineView extends Glyph.View

    _fields: ['x', 'y']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @renderer.map_to_screen(@x, @glyph.x.units, @y, @glyph.y.units)

    _render: (ctx, indices) ->
      drawing = false
      @props.line.set(ctx, @props)

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

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)

      nearest_ind = 0
      nearest_val = Math.abs sx-@sx[0]

      for i in [0...@sx.length]
        ival = Math.abs sx-@sx[i]

        if nearest_val>ival
          nearest_ind = i
          nearest_val = ival

      return [nearest_ind]

    _hit_span: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]

      if geometry.direction == 'v'
        val = @renderer.plot_view.canvas.vy_to_sy(vy)
        glyph_values = @sy
      else
        val = @renderer.plot_view.canvas.vx_to_sx(vx)
        glyph_values = @sx

      nearest_ind = 0
      nearest_val = Math.abs val-glyph_values[0]
      for i in [0...glyph_values.length]
        ival = Math.abs val-glyph_values[i]

        if nearest_val>ival
          nearest_ind = i
          nearest_val = ival

      return [nearest_ind]

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Line extends Glyph.Model
    default_view: LineView
    type: 'Line'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults

  class Lines extends Glyph.Collection
    model: Line

  return {
    Model: Line
    View: LineView
    Collection: new Lines()
  }
