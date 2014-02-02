
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class PatchesView extends Glyph.View

    _fields: ['xs', 'ys']
    _properties: ['line', 'fill']

    _map_data: () ->
      null

    _render: (ctx, indices, glyph_props) ->
      ctx = @plot_view.ctx

      for i in indices

        [sx, sy] = @plot_view.map_to_screen(@xs[i], glyph_props.xs.units, @ys[i], glyph_props.ys.units)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          for j in [0...sx.length]
            if j == 0
              ctx.beginPath()
              ctx.moveTo(sx[j], sy[j])
              continue
            else if isNaN(sx[j] + sy[j])
              ctx.closePath()
              ctx.fill()
              ctx.beginPath()
              continue
            else
              ctx.lineTo(sx[j], sy[j])
          ctx.closePath()
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          for j in [0...sx.length]
            if j == 0
              ctx.beginPath()
              ctx.moveTo(sx[j], sy[j])
              continue
            else if isNaN(sx[j] + sy[j])
              ctx.closePath()
              ctx.stroke()
              ctx.beginPath()
              continue
            else
              ctx.lineTo(sx[j], sy[j])
          ctx.closePath()
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)

  class Patches extends Glyph.Model
    default_view: PatchesView
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
    "Model": Patches,
    "View": PatchesView,
  }
