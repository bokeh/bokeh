_ = require "underscore"
Marker = require "./marker"

class SquareCrossView extends Marker.View

  _render: (ctx, indices, {sx, sy, size}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i])
        continue

      ctx.translate(sx[i], sy[i])

      ctx.beginPath()
      ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        r = size[i]/2
        ctx.moveTo(0,  +r)
        ctx.lineTo(0,  -r)
        ctx.moveTo(-r, 0)
        ctx.lineTo(+r, 0)
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class SquareCross extends Marker.Model
  default_view: SquareCrossView
  type: 'SquareCross'

class SquareCrosses extends Marker.Collection
  model: SquareCross

module.exports =
  Model: SquareCross
  View: SquareCrossView
  Collection: new SquareCrosses()
