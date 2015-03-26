define [
  "underscore"
  "./marker"
], (_, Marker) ->

  class InvertedTriangleView extends Marker.View

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

        if @visuals.fill.do_fill
          @visuals.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @visuals.line.do_stroke
          @visuals.line.set_vectorize(ctx, i)
          ctx.stroke()

  class InvertedTriangle extends Marker.Model
    default_view: InvertedTriangleView
    type: 'InvertedTriangle'

  class InvertedTriangles extends Marker.Collection
    model: InvertedTriangle

  return {
    Model: InvertedTriangle
    View: InvertedTriangleView
    Collection: new InvertedTriangles()
  }
