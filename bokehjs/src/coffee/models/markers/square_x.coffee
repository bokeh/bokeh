_ = require "underscore"
Marker = require "./marker"

class SquareXView extends Marker.View

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if _angle[i]
        ctx.rotate(_angle[i])
      ctx.rect(-_size[i]/2, -_size[i]/2, _size[i], _size[i])
      if _angle[i]
        ctx.rotate(-_angle[i])

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
        r = _size[i]/2
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

class SquareX extends Marker.Model
  default_view: SquareXView
  type: 'SquareX'

module.exports =
  Model: SquareX
  View: SquareXView
