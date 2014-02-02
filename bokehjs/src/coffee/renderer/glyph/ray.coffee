
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class RayView extends Glyph.View

    _fields: ['x', 'y', 'angle', 'length']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      width = @plot_view.view_state.get('width')
      height = @plot_view.view_state.get('height')
      inf_len = 2 * (width + height)
      for i in [0...@length.length]
        if @length[i] == 0 then @length[i] = inf_len

    _render: (ctx, indices, glyph_props) ->
      if glyph_props.line_properties.do_stroke

        for i in indices

          if isNaN(@sx[i] + @sy[i] + @angle[i] + @length[i])
            continue

          ctx.translate(@sx[i], @sy[i])
          ctx.rotate(@angle[i])

          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(@length[i], 0)

          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

          ctx.rotate(-@angle[i])
          ctx.translate(-@sx[i], -@sy[i])

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Ray extends Glyph.Model
    default_view: RayView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Ray,
    "View": RayView
  }
