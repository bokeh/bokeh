
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class LineView extends Glyph.View

    _fields: ['x', 'y']
    _properties: ['line']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)

    _render: (ctx, glyph_props, use_selection) ->
      drawing = false
      console.log "FOO"
      glyph_props.line_properties.set_vectorize(ctx, 0)
      for i in [0..@sx.length-1]

        if isNaN(@sx[i] + @sy[i]) and drawing
          ctx.stroke()
          ctx.beginPath()
          drawing = false
          continue

        if drawing
          ctx.lineTo(@sx[i], @sy[i])
        else
          ctx.beginPath()
          ctx.moveTo(@sx[i], @sy[i])
          drawing = true

      if drawing
        ctx.stroke()

    draw_legend: (ctx, x1, x2, y1, y2) ->
      ctx.save()
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
      else
        glyph_settings = glyph_props
      line_props.set(ctx, glyph_settings)
      ctx.beginPath()
      ctx.moveTo(x1, (y1 + y2) /2)
      ctx.lineTo(x2, (y1 + y2) /2)
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()
      ctx.restore()

    ##duped
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

  class Line extends Glyph.Model
    default_view: LineView
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
    "Model": Line,
    "View": LineView,
  }

