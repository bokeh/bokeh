_ = require "underscore"
Marker = require "./marker"

class SquareCrossView extends Marker.View

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
        r = size[i]/2
        if angle[i]
          ctx.rotate(angle[i])
        ctx.moveTo( 0,  r)
        ctx.lineTo( 0, -r)
        ctx.moveTo(-r,  0)
        ctx.lineTo( r,  0)
        if angle[i]
          ctx.rotate(-angle[i])
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class SquareCross extends Marker.Model
  default_view: SquareCrossView
  type: 'SquareCross'

module.exports =
  Model: SquareCross
  View: SquareCrossView
