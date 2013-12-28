
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class CircleXView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, indices, glyph_props, sx=@sx, sy=@sy, size=@size) ->
      for i in indices

        if isNaN(sx[i] + sy[i] + size[i])
          continue

        ctx.beginPath()
        r = size[i]/2
        ctx.arc(sx[i], sy[i], r, 0, 2*Math.PI, false)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.moveTo(sx[i]-r, sy[i]+r)
          ctx.lineTo(sx[i]+r, sy[i]-r)
          ctx.moveTo(sx[i]-r, sy[i]-r)
          ctx.lineTo(sx[i]+r, sy[i]+r)
          ctx.stroke()

  class CircleX extends Marker.Model
    default_view: CircleXView
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
    "Model": CircleX,
    "View": CircleXView,
  }
