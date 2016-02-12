_ = require "underscore"
Marker = require "./marker"

class DiamondCrossView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i]+angle[i])
        continue

      r = size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if angle[i]
        ctx.rotate(angle[i])
      ctx.moveTo(0, r)
      ctx.lineTo(r/1.5, 0)
      ctx.lineTo(0, -r)
      ctx.lineTo(-r/1.5, 0)
      if angle[i]
        ctx.rotate(-angle[i])
      ctx.closePath()

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        if angle[i]
          ctx.rotate(angle[i])
        ctx.moveTo(0, r)
        ctx.lineTo(0, -r)
        ctx.moveTo(-r/1.5, 0)
        ctx.lineTo(r/1.5, 0)
        if angle[i]
          ctx.rotate(-angle[i])
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])


class DiamondCross extends Marker.Model
  default_view: DiamondCrossView
  type: 'DiamondCross'

module.exports =
  Model: DiamondCross
  View: DiamondCrossView
