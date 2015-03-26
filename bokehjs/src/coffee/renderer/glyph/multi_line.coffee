define [
  "underscore"
  "rbush"
  "./glyph"
], (_, rbush, Glyph) ->

  class MultiLineView extends Glyph.View

    _index_data: () ->
      index = rbush()
      pts = []
      for i in [0...@xs.length]
        xs = (x for x in @xs[i] when not _.isNaN(x))
        ys = (y for y in @ys[i] when not _.isNaN(y))
        if xs.length == 0
          continue
        pts.push([
          _.min(xs), _.min(ys),
          _.max(xs), _.max(ys),
          {'i': i}
        ])
      index.load(pts)
      return index

    _render: (ctx, indices) ->
      for i in indices
        [sx, sy] = @renderer.map_to_screen(@xs[i], @ys[i])

        @visuals.line.set_vectorize(ctx, i)
        for j in [0...sx.length]
          if j == 0
            ctx.beginPath()
            ctx.moveTo(sx[j], sy[j])
            continue
          else if isNaN(sx[j]) or isNaN(sy[j])
            ctx.stroke()
            ctx.beginPath()
            continue
          else
            ctx.lineTo(sx[j], sy[j])
        ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class MultiLine extends Glyph.Model
    default_view: MultiLineView
    type: 'MultiLine'
    visuals: ['line']
    coords: [ ['xs', 'ys'] ]

  class MultiLines extends Glyph.Collection
    model: MultiLine

  return {
    Model: MultiLine
    View: MultiLineView
    Collection: new MultiLines()
  }
