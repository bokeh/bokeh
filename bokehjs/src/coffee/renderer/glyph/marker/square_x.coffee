_ = require "underscore"
Marker = require "./marker"

class SquareXView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i]+angle[i])
        continue

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if angle[i]
        ctx.rotate(angle[i])
      ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])
      if angle[i]
        ctx.rotate(-angle[i])

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
        r = size[i]/2
        if angle[i]
          ctx.rotate(angle[i])
        ctx.moveTo(-r,  r)
        ctx.lineTo( r, -r)
        ctx.moveTo(-r, -r)
        ctx.lineTo( r,  r)
        if angle[i]
          ctx.rotate(-angle[i])
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class SquareX extends Marker.Model
  default_view: SquareXView
  type: 'SquareX'

module.exports =
  Model: SquareX
  View: SquareXView
