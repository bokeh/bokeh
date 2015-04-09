_ = require "underscore"
Marker = require "./marker"

class CrossView extends Marker.View

  _render: (ctx, indices, {sx, sy, size}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i])
        continue

      r = size[i]/2
      ctx.beginPath()
      ctx.moveTo(sx[i],   sy[i]+r)
      ctx.lineTo(sx[i],   sy[i]-r)
      ctx.moveTo(sx[i]-r, sy[i])
      ctx.lineTo(sx[i]+r, sy[i])

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

class Cross extends Marker.Model
  default_view: CrossView
  type: 'Cross'
  props: ['line']

module.exports =
  Model: Cross
  View: CrossView