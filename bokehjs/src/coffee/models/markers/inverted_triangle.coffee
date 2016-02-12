_ = require "underscore"
Marker = require "./marker"

class InvertedTriangleView extends Marker.View

  _render: (ctx, indices, {sx, sy, size, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i]+angle[i])
        continue

      a = size[i] * Math.sqrt(3)/6
      r = size[i]/2
      h = size[i] * Math.sqrt(3)/2

      ctx.beginPath()
      ctx.translate(sx[i], sy[i])

      # TODO use viewstate to take y-axis inversion into account
      if angle[i]
        ctx.rotate(angle[i])
      ctx.moveTo(-r, -a)
      ctx.lineTo(r, -a)
      ctx.lineTo(0, -a+h)
      if angle[i]
        ctx.rotate(-angle[i])

      ctx.translate(-sx[i], -sy[i])
      ctx.closePath()

      if @visuals.fill.do_fill
        @visuals.fill.set_vectorize(ctx, i)
        ctx.fill()

      if @visuals.line.do_stroke
        @visuals.line.set_vectorize(ctx, i)
        ctx.stroke()

class InvertedTriangle extends Marker.Model
  default_view: InvertedTriangleView
  type: 'InvertedTriangle'

module.exports =
  Model: InvertedTriangle
  View: InvertedTriangleView
