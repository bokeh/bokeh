
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
      [@sx0, @sy0] = @plot_view.map_to_screen(
        @left,  @glyph_props.left.units,  @top, @glyph_props.top.units, @x_range_name, @y_range_name
      )
      [@sx1, @sy1] = @plot_view.map_to_screen(
        @right, @glyph_props.right.units, @bottom, @glyph_props.bottom.units, @x_range_name, @y_range_name
      )

    _render: (ctx, indices, glyph_props, sx0=@sx0, sx1=@sx1, sy0=@sy0, sy1=@sy1) ->
      for i in indices

        if isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i])
          continue

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fillRect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])

        if glyph_props.line_properties.do_stroke
          ctx.beginPath()
          ctx.rect(sx0[i], sy0[i], sx1[i]-sx0[i], sy1[i]-sy0[i])
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @plot_view.canvas.vx_to_sx(vx)
      sy = @plot_view.canvas.vy_to_sy(vy)

      hits = []
      for i in [0...@sx0.length]
        if sx >= @sx0[i] and sx <= @sx1[i] and sy >= @sy0[i] and sy < @sy1[i]
          hits.push(i)
      return hits

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)

  class Quad extends Glyph.Model
    default_view: QuadView
    type: 'Glyph'

    display_defaults: ->
      _.extend {}, super(), {
        fill_color: 'gray'
        fill_alpha: 1.0

        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      }

  return {
    "Model": Quad,
    "View": QuadView,
  }
