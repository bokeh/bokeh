define [
  "underscore"
  "rbush"
  "./glyph"
], (_, rbush, Glyph) ->

  class SegmentView extends Glyph.View

    _fields: ['x0', 'y0', 'x1', 'y1']

    _set_data: () ->
      @index = rbush()
      pts = []
      for i in [0...@x0.length]
        if not isNaN(@x0[i] + @x1[i] + @y0[i] + @y1[i])
          pts.push([@x0[i], @y0[i], @x1[i], @y1[i], {'i': i}])
      @index.load(pts)

    _map_data: () ->
      [@sx0, @sy0] = @renderer.map_to_screen(@x0, @y0)
      [@sx1, @sy1] = @renderer.map_to_screen(@x1, @y1)

    _render: (ctx, indices) ->
      if @props.line.do_stroke
        for i in indices
          if isNaN(@sx0[i] + @sy0[i] + @sx1[i] + @sy1[i])
            continue

          ctx.beginPath()
          ctx.moveTo(@sx0[i], @sy0[i])
          ctx.lineTo(@sx1[i], @sy1[i])

          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_line_legend(ctx, x0, x1, y0, y1)

  class Segment extends Glyph.Model
    default_view: SegmentView
    type: 'Segment'
    props: ['line']

  class Segments extends Glyph.Collection
    model: Segment

  return {
    Model: Segment
    View: SegmentView
    Collection: new Segments()
  }
