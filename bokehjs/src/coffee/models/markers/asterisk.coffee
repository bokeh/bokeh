_ = require "underscore"
Marker = require "./marker"

class AsteriskView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i]+angle[i])
        continue

      r = size[i]/2
      r2 = r*0.65

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if angle[i]
        ctx.rotate(angle[i])
      ctx.moveTo( 0,  r)
      ctx.lineTo( 0, -r)
      ctx.moveTo(-r,  0)
      ctx.lineTo( r,  0)
      ctx.moveTo(-r2,  r2)
      ctx.lineTo( r2, -r2)
      ctx.moveTo(-r2, -r2)
      ctx.lineTo( r2,  r2)
      if angle[i]
        ctx.rotate(-angle[i])

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class Asterisk extends Marker.Model
  default_view: AsteriskView
  type: 'Asterisk'
  props: ['line']

module.exports =
  Model: Asterisk
  View: AsteriskView
