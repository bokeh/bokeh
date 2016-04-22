_ = require "underscore"
Marker = require "./marker"

class XView extends Marker.View

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      r = _size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if _angle[i]
        ctx.rotate(_angle[i])
      ctx.moveTo(-r, r)
      ctx.lineTo(r, -r)
      ctx.moveTo(-r,-r)
      ctx.lineTo(r, r)
      if _angle[i]
        ctx.rotate(-_angle[i])

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class X extends Marker.Model
  default_view: XView
  type: 'X'

module.exports =
  Model: X
  View: XView
