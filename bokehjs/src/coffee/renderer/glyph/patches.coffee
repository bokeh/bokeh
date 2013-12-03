
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

    _render: (ctx, glyph_props, use_selection) ->
      ctx = @plot_view.ctx

      ctx.save()
      for i in [0..@xs.length-1]
        [sx, sy] = @plot_view.map_to_screen(@xs[i], glyph_props.xs.units, @ys[i], glyph_props.ys.units)
        if @do_fill
          @glyph_props.fill_properties.set(ctx, pt)
          for i in [0..sx.length-1]
            if i == 0
              ctx.beginPath()
              ctx.moveTo(sx[i], sy[i])
              continue
            else if isNaN(sx[i] + sy[i])
              ctx.closePath()
              ctx.fill()
              ctx.beginPath()
              continue
            else
              ctx.lineTo(sx[i], sy[i])
          ctx.closePath()
          ctx.fill()

        if @do_stroke
          @glyph_props.line_properties.set(ctx, pt)
          for i in [0..sx.length-1]
            if i == 0
              ctx.beginPath()
              ctx.moveTo(sx[i], sy[i])
              continue
            else if isNaN(sx[i] + sy[i])
              ctx.closePath()
              ctx.stroke()
              ctx.beginPath()
              continue
            else
              ctx.lineTo(sx[i], sy[i])
          ctx.closePath()
          ctx.stroke()

      ctx.restore()

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
