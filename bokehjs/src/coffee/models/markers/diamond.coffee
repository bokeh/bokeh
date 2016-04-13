_ = require "underscore"
Marker = require "./marker"

class DiamondView extends Marker.View

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
      ctx.lineTo(r/1.5, 0)
      ctx.lineTo(0, -r)
      ctx.lineTo(-r/1.5, 0)
      if _angle[i]
        ctx.rotate(-_angle[i])

      ctx.translate(-sx[i], -sy[i])
      ctx.closePath()

      if @visuals.fill.doit
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.doit
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

class Diamond extends Marker.Model
  default_view: DiamondView
  type: 'Diamond'

module.exports =
  Model: Diamond
  View: DiamondView
