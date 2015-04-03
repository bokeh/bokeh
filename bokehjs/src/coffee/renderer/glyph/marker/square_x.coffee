_ = require "underscore"
Marker = require "./marker"

class SquareXView extends Marker.View

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
        ctx.stroke()
        r = size[i]/2
        ctx.moveTo(-r, +r)
        ctx.lineTo(+r, -r)
        ctx.moveTo(-r, -r)
        ctx.lineTo(+r, +r)
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class SquareX extends Marker.Model
  default_view: SquareXView
  type: 'SquareX'

class SquareXs extends Marker.Collection
  model: SquareX

module.exports =
  Model: SquareX
  View: SquareXView
  Collection: new SquareXs()
