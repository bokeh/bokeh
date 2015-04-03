_ = require "underscore"
Marker = require "./marker"

class DiamondView extends Marker.View

  _render: (ctx, indices, {sx, sy, size}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+size[i])
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
        ctx.stroke()

class Diamond extends Marker.Model
  default_view: DiamondView
  type: 'Diamond'

class Diamonds extends Marker.Collection
  model: Diamond

module.exports =
  Model: Diamond
  View: DiamondView
  Collection: new Diamonds()
