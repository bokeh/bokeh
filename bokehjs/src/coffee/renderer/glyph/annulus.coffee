
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class AnnulusView extends Glyph.View

    _fields: ['x', 'y', 'inner_radius', 'outer_radius']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @inner_radius = @distance_vector('x', 'inner_radius', 'edge')
      @outer_radius = @distance_vector('x', 'outer_radius', 'edge')

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, inner_radius=@inner_radius, outer_radius=@outer_radius) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i])
          continue

        ctx.beginPath()
        ctx.arc(sx[i], sy[i], inner_radius[i], 0, 2*Math.PI*2, false)
        ctx.moveTo(sx[i]+outer_radius[i], sy[i])
        ctx.arc(sx[i], sy[i], outer_radius[i], 0, 2*Math.PI*2, true)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]
      sx = { }
      sx[reference_point] = (x0+x1)/2
      sy = { }
      sy[reference_point] = (y0+y1)/2

      r = Math.min(Math.abs(x1-x0), Math.abs(y1-y0)) * 0.5
      inner_radius = { }
      inner_radius[reference_point] = r*0.4
      outer_radius = { }
      outer_radius[reference_point] = r*0.8

      @_render(ctx, indices, @glyph_props, sx, sy, inner_radius, outer_radius)

  class Annulus extends Glyph.Model
    default_view: AnnulusView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        fill_color: 'gray'
        fill_alpha: 1.0

        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Annulus,
    "View": AnnulusView,
  }

