_ = require "underscore"
Marker = require "./marker"

class AsteriskView extends Marker.View

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      r = _size[i]/2
      r2 = r*0.65

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if _angle[i]
        ctx.rotate(_angle[i])
      ctx.moveTo( 0,  r)
      ctx.lineTo( 0, -r)
      ctx.moveTo(-r,  0)
      ctx.lineTo( r,  0)
      ctx.moveTo(-r2,  r2)
      ctx.lineTo( r2, -r2)
      ctx.moveTo(-r2, -r2)
      ctx.lineTo( r2,  r2)
      if _angle[i]
        ctx.rotate(-_angle[i])

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class Asterisk extends Marker.Model
  default_view: AsteriskView
  type: 'Asterisk'

module.exports =
  Model: Asterisk
  View: AsteriskView
