_ = require "underscore"
Marker = require "./marker"

class CrossView extends Marker.View

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      r = _size[i]/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      if _angle[i]
        ctx.rotate(_angle[i])
      ctx.moveTo(0, r)
      ctx.lineTo(0, -r)
      ctx.moveTo(-r, 0)
      ctx.lineTo(r, 0)
      if _angle[i]
        ctx.rotate(-_angle[i])

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        if _angle[i]
          ctx.rotate(_angle[i])
        ctx.stroke()
        if _angle[i]
          ctx.rotate(-_angle[i])

      ctx.translate(-sx[i], -sy[i])

class Cross extends Marker.Model
  default_view: CrossView
  type: 'Cross'

module.exports =
  Model: Cross
  View: CrossView
