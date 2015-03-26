define [
  "underscore"
  "./marker"
], (_, Marker) ->

  class SquareView extends Marker.View

    _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + size[i])
          continue

        ctx.translate(sx[i], sy[i])

        ctx.beginPath()
        ctx.rect(-size[i]/2, -size[i]/2, size[i], size[i])

        if @visuals.fill.do_fill
          @visuals.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @visuals.line.do_stroke
          @visuals.line.set_vectorize(ctx, i)
          ctx.stroke()

        ctx.translate(-sx[i], -sy[i])

  class Square extends Marker.Model
    default_view: SquareView
    type: 'Square'
    angles: ['angle']

  class Squares extends Marker.Collection
    model: Square

  return {
    Model: Square
    View: SquareView
    Collection: new Squares()
  }
