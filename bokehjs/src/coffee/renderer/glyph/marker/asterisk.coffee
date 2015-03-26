define [
  "underscore"
  "./marker"
], (_, Marker) ->

  class AsteriskView extends Marker.View

    _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + size[i])
          continue

        r = size[i]/2
        r2 = r*0.65

        ctx.beginPath()
        ctx.moveTo(sx[i],    sy[i]+r )
        ctx.lineTo(sx[i],    sy[i]-r )
        ctx.moveTo(sx[i]-r,  sy[i]   )
        ctx.lineTo(sx[i]+r,  sy[i]   )
        ctx.moveTo(sx[i]-r2, sy[i]+r2)
        ctx.lineTo(sx[i]+r2, sy[i]-r2)
        ctx.moveTo(sx[i]-r2, sy[i]-r2)
        ctx.lineTo(sx[i]+r2, sy[i]+r2)

        if @visuals.line.do_stroke
          @visuals.line.set_vectorize(ctx, i)
          ctx.stroke()

  class Asterisk extends Marker.Model
    default_view: AsteriskView
    type: 'Asterisk'
    props: ['line']

  class Asterisks extends Marker.Collection
    model: Asterisk

  return {
    Model: Asterisk
    View: AsteriskView
    Collection: new Asterisks()
  }
