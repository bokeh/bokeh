define [
  "underscore",
  "./marker",
], (_, Marker) ->

  class SquareView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + size[i])
          continue

        ctx.translate(sx[i], sy[i])

        ctx.beginPath()
        ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @props.line.do_stroke
          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

        ctx.translate(-sx[i], -sy[i])

  class Square extends Marker.Model
    default_view: SquareView
    type: 'Square'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class Squares extends Marker.Collection
    model: Square

  return {
    Model: Square
    View: SquareView
    Collection: new Squares()
  }
