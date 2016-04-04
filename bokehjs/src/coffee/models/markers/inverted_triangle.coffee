_ = require "underscore"
Marker = require "./marker"

class InvertedTriangleView extends Marker.View

  _render: (ctx, indices, {sx, sy, _size, _angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+_size[i]+_angle[i])
        continue

      a = _size[i] * Math.sqrt(3)/6
      r = _size[i]/2
      h = _size[i] * Math.sqrt(3)/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      # TODO use viewstate to take y-axis inversion into account
      if _angle[i]
        ctx.rotate(_angle[i])
      ctx.moveTo(-r, -a)
      ctx.lineTo(r, -a)
      ctx.lineTo(0, -a+h)
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

class InvertedTriangle extends Marker.Model
  default_view: InvertedTriangleView
  type: 'InvertedTriangle'

module.exports =
  Model: InvertedTriangle
  View: InvertedTriangleView
