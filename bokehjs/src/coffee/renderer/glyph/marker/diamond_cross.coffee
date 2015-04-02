_ = require "underscore"
Marker = require "./marker"

class DiamondCrossView extends Marker.View

  _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
    for i in indices
      if isNaN(sx[i] + sy[i] + size[i])
        continue

      r = size[i]/2
      ctx.beginPath()
      ctx.moveTo(sx[i],   sy[i]+r)
      ctx.lineTo(sx[i]+r, sy[i])
      ctx.lineTo(sx[i],   sy[i]-r)
      ctx.lineTo(sx[i]-r, sy[i])
      ctx.closePath()

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.moveTo(sx[i],   sy[i]+r)
        ctx.lineTo(sx[i],   sy[i]-r)
        ctx.moveTo(sx[i]-r, sy[i])
        ctx.lineTo(sx[i]+r, sy[i])
        ctx.stroke()

class DiamondCross extends Marker.Model
  default_view: DiamondCrossView
  type: 'DiamondCross'

module.exports =
  Model: DiamondCross
  View: DiamondCrossView