
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class XView extends Marker.View

    _properties: ['line']

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, size=@size) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + size[i])
          continue

        r = size[i]/2
        ctx.beginPath()
        ctx.moveTo(sx[i]-r, sy[i]+r)
        ctx.lineTo(sx[i]+r, sy[i]-r)
        ctx.moveTo(sx[i]-r, sy[i]-r)
        ctx.lineTo(sx[i]+r, sy[i]+r)

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()
      return

  class X extends Marker.Model
    default_view: XView
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
    "Model": X,
    "View": XView,
  }

