define [
  "underscore",
  "./marker",
], (_, Marker) ->

  class DiamondCrossView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, indices, sx=@sx, sy=@sy, size=@size) ->
      for i in indices
        if isNaN(sx[i] + sy[i] + size[i])
          continue

        r = size[i]/2
        ctx.beginPath()
        ctx.moveTo(sx[i],   sy[i]+r)
        ctx.lineTo(sx[i]+r, sy[i])
        ctx.lineTo(sx[i],   sy[i]-r)
        ctx.lineTo(sx[i]-r, sy[i])
        ctx.closePath()

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fill()

        if @props.line.do_stroke
          @props.line.set_vectorize(ctx, i)
          ctx.moveTo(sx[i],   sy[i]+r)
          ctx.lineTo(sx[i],   sy[i]-r)
          ctx.moveTo(sx[i]-r, sy[i])
          ctx.lineTo(sx[i]+r, sy[i])
          ctx.stroke()

  class DiamondCross extends Marker.Model
    default_view: DiamondCrossView
    type: 'DiamondCross'

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class DiamondCrosses extends Marker.Collection
    model: DiamondCross

  return {
    Model: DiamondCross
    View: DiamondCrossView
    Collection: new DiamondCrosses()
  }
