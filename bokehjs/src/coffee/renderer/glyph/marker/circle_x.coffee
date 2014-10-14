define [
  "underscore",
  "./marker",
], (_, Marker) ->

  class CircleXView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + size[i])
          continue

        ctx.beginPath()
        r = size[i]/2
        ctx.arc(sx[i], sy[i], r, 0, 2*Math.PI, false)

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @props.line.do_stroke
          @props.line.set_vectorize(ctx, i)
          ctx.moveTo(sx[i]-r, sy[i]+r)
          ctx.lineTo(sx[i]+r, sy[i]-r)
          ctx.moveTo(sx[i]-r, sy[i]-r)
          ctx.lineTo(sx[i]+r, sy[i]+r)
          ctx.stroke()

  class CircleX extends Marker.Model
    default_view: CircleXView
    type: 'CircleX'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class CircleXs extends Marker.Collection
    model: CircleX

  return {
    Model: CircleX
    View: CircleXView
    Collection: new CircleXs()
  }
