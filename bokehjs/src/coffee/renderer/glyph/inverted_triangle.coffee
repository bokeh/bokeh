
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class InvertedTriangleView extends Marker.View

    _fields: ['x', 'y', 'size']
    _properties: ['line', 'fill']

    _render: (ctx, glyph_props, use_selection) ->
      if not glyph_props
        glyph_props = @glyph_props
      for i in [0..@sx.length-1]
        if isNaN(@sx[i] + @sy[i] + @size[i]) or not @mask[i]
          continue
        if use_selection and not @selected_mask[i]
          continue
        if use_selection == false and @selected_mask[i]
          continue
        a = @size[i] * Math.sqrt(3)/6
        r = @size[i]/2
        h = @size[i] * Math.sqrt(3)/2
        console.log a, r, h
        ctx.beginPath()
        # TODO use viewstate to take y-axis inversion into account
        ctx.moveTo(@sx[i]-r, @sy[i]-a)
        ctx.lineTo(@sx[i]+r, @sy[i]-a)
        ctx.lineTo(@sx[i],   @sy[i]-a+h)
        ctx.closePath()

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
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
        data_r = @distance([reference_point], 'x', 'size', 'edge')[0]
      else
        glyph_settings = glyph_props
        data_r = glyph_props.select('size', glyph_props).default
      border = line_props.select(line_props.line_width_name, glyph_settings)
      d = _.min([Math.abs(x2-x1), Math.abs(y2-y1)])
      d = d - 2 * border
      r = d / 2
      if data_r?
        r = if data_r > r then r else data_r
      x = (x1 + x2) / 2.0
      y = (y1 + y2) / 2.0
      a = @size[i] * Math.sqrt(3)/6
      r = @size[i]/2
      h = @size[i] * Math.sqrt(3)/2
      ctx.beginPath()
      # TODO use viewstate to take y-axis inversion into account
      ctx.moveTo(@sx[i]-r, @sy[i]-a)
      ctx.lineTo(@sx[i]+r, @sy[i]-a)
      ctx.lineTo(@sx[i],   @sy[i]-a+h)
      ctx.closePath()
      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()

      ctx.restore()

  class InvertedTriangle extends Marker.Model
    default_view: InvertedTriangleView
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
    "Model": InvertedTriangle,
    "View": InvertedTriangleView,
  }
