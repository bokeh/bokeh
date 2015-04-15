_ = require "underscore"
Marker = require "./marker"

class CircleCrossView extends Marker.View

  _render: (ctx, indices, {sx, sy, size}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i])
        continue

      ctx.beginPath()
      r = size[i]/2
      ctx.arc(sx[i], sy[i], r, 0, 2*Math.PI, false)

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx,i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.moveTo(sx[i],   sy[i]+r)
        ctx.lineTo(sx[i],   sy[i]-r)
        ctx.moveTo(sx[i]-r, sy[i])
        ctx.lineTo(sx[i]+r, sy[i])
        ctx.stroke()

class CircleCross extends Marker.Model
  default_view: CircleCrossView
  type: 'CircleCross'

module.exports =
  Model: CircleCross
  View: CircleCrossView