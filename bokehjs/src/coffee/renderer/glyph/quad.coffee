
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class QuadView extends Glyph.View

    _fields: ['right', 'left', 'bottom', 'top']
    _properties: ['line', 'fill']

    _set_data: () ->
      @index = rbush()
      @index.load(
        ([@left[i], @bottom[i], @right[i], @top[i], {'i': i}] for i in [0...@left.length])
      )

    _map_data: () ->
      [@sx0, @sy0] = @plot_view.map_to_screen(@left,  @glyph_props.left.units,  @top,    @glyph_props.top.units)
      [@sx1, @sy1] = @plot_view.map_to_screen(@right, @glyph_props.right.units, @bottom, @glyph_props.bottom.units)

    _mask_data: () ->
      ow = @plot_view.view_state.get('outer_width')
      oh = @plot_view.view_state.get('outer_height')
      [x0, x1] = @plot_view.xmapper.v_map_from_target([0, ow])

      vr = @plot_view.view_state.get('inner_range_vertical')
      [y0, y1] = @plot_view.ymapper.v_map_from_target([0, ow])
      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

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

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)

  class Quad extends Glyph.Model
    default_view: QuadView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        fill_color: 'gray'
        fill_alpha: 1.0

        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Quad,
    "View": QuadView,
  }
