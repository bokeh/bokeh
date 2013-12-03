
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class SegmentView extends Glyph.View

    _fields: ['x0', 'y0', 'x1', 'y1']
    _properties: ['line']

    _map_data: () ->
      [@sx0, @sy0] = @plot_view.map_to_screen(@x0, @glyph_props.x0.units, @y0, @glyph_props.y0.units)
      [@sx1, @sy1] = @plot_view.map_to_screen(@x1, @glyph_props.x1.units, @y1, @glyph_props.y1.units)

    _render: (ctx, glyph_props, use_selection) ->
      if glyph_props.line_properties.do_stroke

        for i in [0..@sx0.length-1]

          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.lineTo(@sx1[i], @sy1[i])

          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x1, x2, y1, y2) ->
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
      else
        glyph_settings = glyph_props
      line_props.set(ctx, glyph_settings)
      ctx.beginPath()
      ctx.moveTo(x1, (y1 + y2) /2)
      ctx.lineTo(x2, (y1 + y2) /2)
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()
      ctx.restore()

  class Segment extends Glyph.Model
    default_view: SegmentView
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
    "Model": Segment,
    "View": SegmentView,
  }
