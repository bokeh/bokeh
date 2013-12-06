
define [
  "underscore",
  "rbush",
  "renderer/properties",
  "./glyph",
], (_, rbush, Properties, Glyph) ->

  class CircleView extends Glyph.View

    _fields: ['x', 'y', 'radius']
    _properties: ['line', 'fill']

    _set_data: () ->
      @max_radius = _.max(@radius)
      @index = rbush()
      @index.load(
        ([@x[i], @y[i], @x[i], @y[i], {'index': i}] for i in [0..@x.length-1])
      )

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      ds = @mget_obj('data_source')
      @radius = @distance_vector('x', 'radius', 'edge')

    _mask_data: () ->
      hr = @plot_view.view_state.get('inner_range_horizontal')
      vr = @plot_view.view_state.get('inner_range_vertical')

      if @radius_units == "screen"
        sx0 = hr.get('start') - @max_radius
        sx1 = hr.get('end') - @max_radius
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])

        sy0 = vr.get('start') - @max_radius
        sy1 = vr.get('end') - @max_radius
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])

      else
        sx0 = hr.get('start')
        sx1 = hr.get('end')
        [x0, x1] = @plot_view.xmapper.v_map_from_target([sx0, sx1])
        x0 -= @max_radius
        x1 += @max_radius

        sy0 = vr.get('start')
        sy1 = vr.get('end')
        [y0, y1] = @plot_view.ymapper.v_map_from_target([sy0, sy1])
        y0 -= @max_radius
        y1 += @max_radius

      @mask = (x[4].i for x in @index.search([x0, y0, x1, y1]))

    _render: (ctx, glyph_props, use_selection) ->
      for i in @mask

        if isNaN(@sx[i] + @sy[i] + @radius[i])
            continue
        if use_selection and not @selected_mask[i]
          continue
        if use_selection == false and @selected_mask[i]
          continue

        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @radius[i], 0, 2*Math.PI, false)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx,i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    select: (xscreenbounds, yscreenbounds) ->
      xscreenbounds = [@plot_view.view_state.sx_to_device(xscreenbounds[0]),
        @plot_view.view_state.sx_to_device(xscreenbounds[1])]
      yscreenbounds = [@plot_view.view_state.sy_to_device(yscreenbounds[0]),
        @plot_view.view_state.sy_to_device(yscreenbounds[1])]
      xscreenbounds = [_.min(xscreenbounds), _.max(xscreenbounds)]
      yscreenbounds = [_.min(yscreenbounds), _.max(yscreenbounds)]
      selected = []
      for i in [0..@sx.length-1]
        if xscreenbounds
          if @sx[i] < xscreenbounds[0] or @sx[i] > xscreenbounds[1]
            continue
        if yscreenbounds
          if @sy[i] < yscreenbounds[0] or @sy[i] > yscreenbounds[1]
            continue
        selected.push(i)
      return selected

    draw_legend: (ctx, x1, x2, y1, y2) ->
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      fill_props = glyph_props.fill_properties
      ctx.save()
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
        data_r = @distance([reference_point], 'x', 'radius', 'edge')[0]
      else
        glyph_settings = glyph_props
        data_r = glyph_props.select('radius', glyph_props).default
      border = line_props.select(line_props.line_width_name, glyph_settings)
      ctx.beginPath()
      d = _.min([Math.abs(x2-x1), Math.abs(y2-y1)])
      d = d - 2 * border
      r = d / 2
      if data_r?
        r = if data_r > r then r else data_r
      ctx.arc((x1 + x2) / 2.0, (y1 + y2) / 2.0, r, 2*Math.PI,false)
      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()

      ctx.restore()

  class Circle extends Glyph.Model
    default_view: CircleView
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
    "Model": Circle,
    "View": CircleView,
  }
