
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class SquareCrossView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, size=@size) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + size[i])
          continue

        ctx.translate(sx[i], sy[i])

        ctx.beginPath()
        ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          r = size[i]/2
          ctx.moveTo(0,  +r)
          ctx.lineTo(0,  -r)
          ctx.moveTo(-r, 0)
          ctx.lineTo(+r, 0)
          ctx.stroke()

        ctx.translate(-sx[i], -sy[i])

  class SquareCross extends Marker.Model
    default_view: SquareCrossView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        size_units: 'screen'

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
    "Model": SquareCross,
    "View": SquareCrossView,
  }

