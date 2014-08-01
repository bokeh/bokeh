
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class PatchesView extends Glyph.View

    _fields: ['xs', 'ys']
    _properties: ['line', 'fill']

    _set_data: () ->
      @max_size = _.max(@size)
      @index = rbush()
      pts = []
      for i in [0...@xs.length]
        if @xs.length == 0
          continue
        pts.push([
          _.min(@xs[i]), _.min(@ys[i]),
          _.max(@xs[i]), _.max(@ys[i]),
          {'i': i}
        ])
      @index.load(pts)

    _map_data: () ->
      @sxs = []
      @sys = []
      for i in [0...@xs.length]
        [sx, sy] = @plot_view.map_to_screen(@xs[i], @glyph_props.xs.units, @ys[i], @glyph_props.ys.units)
        @sxs.push(sx)
        @sys.push(sy)

    _mask_data: () ->
      # if user uses screen units, punt on trying to mask data
      if @glyph_props.xs.units == "screen" or @glyph_props.ys.units == "screen"
        return @all_indices

      hr = @plot_view.frame.get('inner_range_horizontal')
      [x0, x1] = @plot_view.xmapper.v_map_from_target([hr.get('start'), hr.get('end')])

      vr = @plot_view.frame.get('inner_range_vertical')
      [y0, y1] = @plot_view.ymapper.v_map_from_target([vr.get('start'), vr.get('end')])

      return (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _render: (ctx, indices, glyph_props) ->

      for i in indices

        [sx, sy] = [@sxs[i], @sys[i]]

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          for j in [0...sx.length]
            if j == 0
              ctx.beginPath()
              ctx.moveTo(sx[j], sy[j])
              continue
            else if isNaN(sx[j] + sy[j])
              ctx.closePath()
              ctx.fill()
              ctx.beginPath()
              continue
            else
              ctx.lineTo(sx[j], sy[j])
          ctx.closePath()
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          for j in [0...sx.length]
            if j == 0
              ctx.beginPath()
              ctx.moveTo(sx[j], sy[j])
              continue
            else if isNaN(sx[j] + sy[j])
              ctx.closePath()
              ctx.stroke()
              ctx.beginPath()
              continue
            else
              ctx.lineTo(sx[j], sy[j])
          ctx.closePath()
          ctx.stroke()

    _hit_point: (geometry) ->
      [vx, vy] = [geometry.vx, geometry.vy]
      sx = @plot_view.canvas.vx_to_sx(vx)
      sy = @plot_view.canvas.vy_to_sy(vy)

      x = @plot_view.xmapper.map_from_target(vx)
      y = @plot_view.ymapper.map_from_target(vy)

      candidates = (x[4].i for x in @index.search([x, y, x, y]))

      # TODO (bev) need to do point in poly test here
      hits = candidates

      return hits

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @_generic_area_legend(ctx, x0, x1, y0, y1)

  class Patches extends Glyph.Model
    default_view: PatchesView
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
    "Model": Patches,
    "View": PatchesView,
  }
