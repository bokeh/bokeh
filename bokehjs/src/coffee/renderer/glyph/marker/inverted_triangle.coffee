define [
  "underscore",
  "./marker",
], (_, Marker) ->

  class InvertedTriangleView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + size[i])
          continue

        a = size[i] * Math.sqrt(3)/6
        r = size[i]/2
        h = size[i] * Math.sqrt(3)/2
        ctx.beginPath()
        # TODO use viewstate to take y-axis inversion into account
        ctx.moveTo(sx[i]-r, sy[i]-a)
        ctx.lineTo(sx[i]+r, sy[i]-a)
        ctx.lineTo(sx[i],   sy[i]-a+h)
        ctx.closePath()

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @props.line.do_stroke
          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

  class InvertedTriangle extends Marker.Model
    default_view: InvertedTriangleView
    type: 'InvertedTriangle'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class InvertedTriangles extends Marker.Collection
    model: InvertedTriangle

  return {
    Model: InvertedTriangle
    View: InvertedTriangleView
    Collection: new InvertedTriangles()
  }
