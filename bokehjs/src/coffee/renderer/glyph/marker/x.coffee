_ = require "underscore"
Marker = require "./marker"

class XView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i]+angle[i])
        continue

      r = size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if angle[i]
        ctx.rotate(angle[i])
      ctx.moveTo(-r, r)
      ctx.lineTo(r, -r)
      ctx.moveTo(-r,-r)
      ctx.lineTo(r, r)
      if angle[i]
        ctx.rotate(-angle[i])

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

      ctx.translate(-sx[i], -sy[i])

class X extends Marker.Model
  default_view: XView
  type: 'X'
  props: ['line']

module.exports =
  Model: X
  View: XView
