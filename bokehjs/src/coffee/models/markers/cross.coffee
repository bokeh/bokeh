_ = require "underscore"
Marker = require "./marker"

class CrossView extends Marker.View

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
      ctx.lineTo(0, -r)
      ctx.moveTo(-r, 0)
      ctx.lineTo(r, 0)
      if angle[i]
        ctx.rotate(-angle[i])

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        if angle[i]
          ctx.rotate(angle[i])
        ctx.stroke()
        if angle[i]
          ctx.rotate(-angle[i])

      ctx.translate(-sx[i], -sy[i])

class Cross extends Marker.Model
  default_view: CrossView
  type: 'Cross'
  props: ['line']

module.exports =
  Model: Cross
  View: CrossView
