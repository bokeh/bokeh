
define [
  "underscore",
  "renderer/properties",
  "./marker",
], (_, Properties, Marker) ->

  class AsteriskView extends Marker.View

    _properties: ['line']

    _render: (ctx, glyph_props, use_selection) ->
      if glyph_props.line_properties.do_stroke

        for i in @mask

          if isNaN(@sx[i] + @sy[i] + @size[i])
            continue
          if use_selection and not @selected_mask[i]
            continue
          if use_selection == false and @selected_mask[i]
            continue

          r = @size[i]/2
          r2 = r*0.65

          ctx.beginPath()
          ctx.moveTo(@sx[i],    @sy[i]+r )
          ctx.lineTo(@sx[i],    @sy[i]-r )
          ctx.moveTo(@sx[i]-r,  @sy[i]   )
          ctx.lineTo(@sx[i]+r,  @sy[i]   )
          ctx.moveTo(@sx[i]-r2, @sy[i]+r2)
          ctx.lineTo(@sx[i]+r2, @sy[i]-r2)
          ctx.moveTo(@sx[i]-r2, @sy[i]-r2)
          ctx.lineTo(@sx[i]+r2, @sy[i]+r2)

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
        data_r = @distance_vector('x', 'size', 'edge')[0]
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
      r = r*0.65
      x = (x1 + x2) / 2.0
      y = (y1 + y2) / 2.0
      ctx.moveTo(x,   y+r)
      ctx.lineTo(x,   y-r)
      ctx.moveTo(x-r, y)
      ctx.lineTo(x+r, y)
      ctx.moveTo(x-r2, y+r2)
      ctx.lineTo(x+r2, y-r2)
      ctx.moveTo(x-r2, y-r2)
      ctx.lineTo(x+r2, y+r2)
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()

      ctx.restore()

  class Asterisk extends Marker.Model
    default_view: AsteriskView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        line_color: 'red'
        line_width: 1
        line_alpha: 1.0
        line_join: 'miter'
        line_cap: 'butt'
        line_dash: []
        line_dash_offset: 0
      })

  return {
    "Model": Asterisk,
    "View": AsteriskView,
  }
