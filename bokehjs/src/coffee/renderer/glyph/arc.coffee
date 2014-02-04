
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class ArcView extends Glyph.View

    _fields: ['x', 'y', 'radius', 'start_angle', 'end_angle', 'direction:string']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @radius = @distance_vector('x', 'radius', 'edge')

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, radius=@radius) ->
      if glyph_props.line_properties.do_stroke

        for i in indices
          if isNaN(sx[i] + sy[i] + radius[i] + @start_angle[i] + @end_angle[i] + @direction[i])
            continue

          ctx.beginPath()
          ctx.arc(sx[i], sy[i], radius[i], @start_angle[i], @end_angle[i], @direction[i])

          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]
      sx = { }
      sx[reference_point] = (x0+x1)/2
      sy = { }
      sy[reference_point] = (y0+y1)/2

      radius = { }
      radius[reference_point] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4

      @_render(ctx, indices, @glyph_props, sx, sy, radius)

  class Arc extends Glyph.Model
    default_view: ArcView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        direction: 'anticlock'
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Arc,
    "View": ArcView,
  }
