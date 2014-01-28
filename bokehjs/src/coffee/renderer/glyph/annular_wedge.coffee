
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class AnnularWedgeView extends Glyph.View

    _fields: ['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction:string'],
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @inner_radius = @distance_vector('x', 'inner_radius', 'edge')
      @outer_radius = @distance_vector('x', 'outer_radius', 'edge')
      @angle = new Float32Array(@start_angle.length)
      for i in [0...@start_angle.length]
        @angle[i] = @end_angle[i] - @start_angle[i]

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, inner_radius=@inner_radius, outer_radius=@outer_radius) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + inner_radius[i] + outer_radius[i] + @start_angle[i] + @angle[i])
          continue

        ctx.translate(sx[i], sy[i])
        ctx.rotate(@start_angle[i])

        ctx.moveTo(outer_radius[i], 0)
        ctx.beginPath()
        ctx.arc(0, 0, outer_radius[i], 0, @angle[i], @direction[i])
        ctx.rotate(@angle[i])
        ctx.lineTo(inner_radius[i], 0)
        ctx.arc(0, 0, inner_radius[i], 0, -@angle[i], not @direction[i])
        ctx.closePath()

        ctx.rotate(-@angle[i]-@start_angle[i])
        ctx.translate(-sx[i], -sy[i])

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
      inner_radius[reference_point] = r*0.25
      outer_radius = { }
      outer_radius[reference_point] = r*0.8

      @_render(ctx, indices, @glyph_props, sx, sy, inner_radius, outer_radius)

  class AnnularWedge extends Glyph.Model
    default_view: AnnularWedgeView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        direction: 'anticlock'

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
    "Model": AnnularWedge,
    "View": AnnularWedgeView,
  }
