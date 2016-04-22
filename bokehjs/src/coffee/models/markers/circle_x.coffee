_ = require "underscore"
Marker = require "./marker"

class CircleXView extends Marker.View

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      r = _size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      ctx.arc(0, 0, r, 0, 2*Math.PI, false)

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        if _angle[i]
          ctx.rotate(_angle[i])
        ctx.moveTo(-r,  r)
        ctx.lineTo( r, -r)
        ctx.moveTo(-r, -r)
        ctx.lineTo( r,  r)
        if _angle[i]
          ctx.rotate(-_angle[i])
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class CircleX extends Marker.Model
  default_view: CircleXView
  type: 'CircleX'

module.exports =
  Model: CircleX
  View: CircleXView
