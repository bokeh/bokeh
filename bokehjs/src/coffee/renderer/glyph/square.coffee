
define [
  "underscore",
  "common/collection",
  "renderer/properties",
  "./marker",
], (_, Collection, Properties, Marker) ->

  class SquareView extends Marker.View

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
          ctx.stroke()

        ctx.translate(-sx[i], -sy[i])

  class Square extends Marker.Model
    default_view: SquareView
    type: 'Square'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults, {
        size_units: 'screen'
      }

  class Squares extends Collection
    model: Square

  return {
    Model: Square
    View: SquareView
    Collection: new Squares()
  }
