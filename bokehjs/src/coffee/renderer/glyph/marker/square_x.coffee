define [
  "underscore",
  "./marker",
], (_, Marker) ->

  class SquareXView extends Marker.View

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
          r = size[i]/2
          ctx.moveTo(-r, +r)
          ctx.lineTo(+r, -r)
          ctx.moveTo(-r, -r)
          ctx.lineTo(+r, +r)
          ctx.stroke()

        ctx.translate(-sx[i], -sy[i])

  class SquareX extends Marker.Model
    default_view: SquareXView
    type: 'SquareX'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class SquareXs extends Marker.Collection
    model: SquareX

  return {
    Model: SquareX
    View: SquareXView
    Collection: new SquareXs()
  }
