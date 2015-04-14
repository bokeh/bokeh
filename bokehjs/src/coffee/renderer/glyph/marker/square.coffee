_ = require "underscore"
Marker = require "./marker"

class SquareView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i])
        continue

      ctx.beginPath()

      if angle[i]
        ctx.translate(sx[i], sy[i])
        ctx.rotate(angle[i])
        ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])
        ctx.rotate(-angle[i])
      else
        ctx.translate(sx[i], sy[i])
        ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])

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
  angles: ['angle']

module.exports =
  Model: Square
  View: SquareView
