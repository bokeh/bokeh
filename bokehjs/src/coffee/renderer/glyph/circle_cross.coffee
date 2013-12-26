
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class CircleCrossView extends Marker.View

    _properties: ['line', 'fill']

    _render: (ctx, glyph_props, use_selection) ->
      for i in @mask

        if isNaN(@sx[i] + @sy[i] + @size[i])
          continue
        if use_selection and not @selected_mask[i]
          continue
        if use_selection == false and @selected_mask[i]
          continue

        ctx.beginPath()
        r = @size[i]/2
        ctx.arc(@sx[i], @sy[i], r, 0, 2*Math.PI, false)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx,i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.moveTo(@sx[i],   @sy[i]+r)
          ctx.lineTo(@sx[i],   @sy[i]-r)
          ctx.moveTo(@sx[i]-r, @sy[i])
          ctx.lineTo(@sx[i]+r, @sy[i])
          ctx.stroke()

    select: (xscreenbounds, yscreenbounds) ->
      xscreenbounds = [@plot_view.view_state.vx_to_sx(xscreenbounds[0]),
        @plot_view.view_state.vx_to_sx(xscreenbounds[1])]
      yscreenbounds = [@plot_view.view_state.vy_to_sy(yscreenbounds[0]),
        @plot_view.view_state.vy_to_sy(yscreenbounds[1])]
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
        data_r = @distance([reference_point], 'x', 'size', 'edge')[0]
      else
        glyph_settings = glyph_props
        data_r = glyph_props.select('size', glyph_props).default
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
        ctx.moveTo(x,   y+r)
        ctx.lineTo(x,   y-r)
        ctx.moveTo(x-r, y)
        ctx.lineTo(x+r, y)
        ctx.stroke()

      ctx.restore()

  class CircleCross extends Marker.Model
    default_view: CircleCrossView
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
    "Model": CircleCross,
    "View": CircleCrossView,
  }
