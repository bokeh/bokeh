define [
  "underscore"
  "rbush"
  "./glyph"
], (_, rbush, Glyph) ->

  class QuadView extends Glyph.View

    _fields: ['right', 'left', 'bottom', 'top']

    _set_data: () ->
      @index = rbush()
      pts = []
      for i in [0...@left.length]
        if not isNaN(@left[i] + @right[i] + @top[i] + @bottom[i])
          pts.push([@left[i], @bottom[i], @right[i], @top[i], {'i': i}])
      @index.load(pts)

    _map_data: () ->
      [@sx0, @sy0] = @renderer.map_to_screen(@left, @top)
      [@sx1, @sy1] = @renderer.map_to_screen(@right, @bottom)

    _render: (ctx, indices, sx0=@sx0, sx1=@sx1, sy0=@sy0, sy1=@sy1) ->
      for i in indices
        if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
          continue

        if @props.fill.do_fill
          @props.fill.set_vectorize(ctx, i)
          ctx.fillRect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])

        if @props.line.do_stroke
          ctx.beginPath()
          ctx.rect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])
          @props.line.set_vectorize(ctx, i)
          ctx.stroke()

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @renderer.plot_view.canvas.vx_to_sx(vx)
      sy = @renderer.plot_view.canvas.vy_to_sy(vy)

      hits = []
      for i in [0...@sx0.length]
        if sx >= @sx0[i] and sx <= @sx1[i] and sy >= @sy0[i] and sy < @sy1[i]
          hits.push(i)
      return hits

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)

  class Quad extends Glyph.Model
    default_view: QuadView
    type: 'Quad'

  class Quads extends Glyph.Collection
    model: Quad

  return {
    Model: Quad
    View: QuadView
    Collection: new Quads()
  }
