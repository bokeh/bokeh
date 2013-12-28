
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class MultiLineView extends Glyph.View

    _fields: ['xs', 'ys']
    _properties: ['line']

    _map_data: () ->
      null

    _render: (ctx, indices, glyph_props) ->

      for i in indices

        x = @xs[i]
        y = @ys[i]
        [sx, sy] = @plot_view.map_to_screen(x, @glyph_props.xs.units, y, @glyph_props.ys.units)

        glyph_props.line_properties.set_vectorize(ctx, i)
        for j in [0..sx.length-1]
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

    draw_legend: (ctx, x1, x2, y1, y2) ->
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
      else
        glyph_settings = glyph_props
      ctx.beginPath()
      ctx.moveTo(x1, (y1 + y2) /2)
      ctx.lineTo(x2, (y1 + y2) /2)
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()
      ctx.restore()

  class MultiLine extends Glyph.Model
    default_view: MultiLineView
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
    "Model": MultiLine,
    "View": MultiLineView,
  }
