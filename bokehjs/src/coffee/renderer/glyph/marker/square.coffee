_ = require "underscore"
Marker = require "./marker"

class SquareView extends Marker.View

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

      ctx.translate(-sx[i], -sy[i])

class Square extends Marker.Model
  default_view: SquareView
  type: 'Square'

module.exports =
  Model: Square
  View: SquareView
