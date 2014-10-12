define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class QuadView extends Glyph.View

    _fields: ['right', 'left', 'bottom', 'top']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx0, @sy0] = @renderer.map_to_screen(@left,  @glyph.left.units,  @top,    @glyph.top.units)
      [@sx1, @sy1] = @renderer.map_to_screen(@right, @glyph.right.units, @bottom, @glyph.bottom.units)

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

    display_defaults: ->
      return _.extend {}, super(), @line_defaults, @fill_defaults

  class Quads extends Glyph.Collection
    model: Quad

  return {
    Model: Quad
    View: QuadView
    Collection: new Quads()
  }
