_ = require "underscore"
Marker = require "./marker"

class SquareView extends Marker.View

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

      ctx.translate(-sx[i], -sy[i])

class Square extends Marker.Model
  default_view: SquareView
  type: 'Square'

module.exports =
  Model: Square
  View: SquareView
