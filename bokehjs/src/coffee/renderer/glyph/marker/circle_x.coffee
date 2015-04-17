_ = require "underscore"
Marker = require "./marker"

class CircleXView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i])
        continue

      r = size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      ctx.arc(0, 0, r, 0, 2*Math.PI, false)

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        if angle[i]
          ctx.rotate(angle[i])
        ctx.moveTo( 0,   r)
        ctx.lineTo( 0,  -r)
        ctx.moveTo(-r,  0)
        ctx.lineTo( r,   0)
        if angle[i]
          ctx.rotate(-angle[i])
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class CircleX extends Marker.Model
  default_view: CircleXView
  type: 'CircleX'

module.exports =
  Model: CircleX
  View: CircleXView
