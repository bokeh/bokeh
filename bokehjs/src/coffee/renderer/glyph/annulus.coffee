
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class AnnulusView extends Glyph.View

    _fields: ['x', 'y', 'inner_radius', 'outer_radius']
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @inner_radius = @distance_vector('x', 'inner_radius', 'edge')
      @outer_radius = @distance_vector('x', 'outer_radius', 'edge')

    _render: (ctx, glyph_props, use_selection) ->
      for i in [0..@sx.length-1]

        if isNaN(@sx[i] + @sy[i] + @inner_radius[i] + @outer_radius[i])
          continue
        if use_selection == true and not @selected_mask[i]
          continue
        if use_selection == false and @selected_mask[i]
          continue

        ctx.beginPath()
        ctx.arc(@sx[i], @sy[i], @inner_radius[i], 0, 2*Math.PI*2, false)
        ctx.moveTo(@sx[i]+@outer_radius[i], @sy[i])
        ctx.arc(@sx[i], @sy[i], @outer_radius[i], 0, 2*Math.PI*2, true)

        if glyph_props.fill_properties.do_fill
          glyph_props.fill_properties.set_vectorize(ctx, i)
          ctx.fill()

        if glyph_props.line_properties.do_stroke
          glyph_props.line_properties.set_vectorize(ctx, i)
          ctx.stroke()

    draw_legend: (ctx, x1, x2, y1, y2) ->
      glyph_props = @glyph_props
      line_props = glyph_props.line_properties
      fill_props = glyph_props.fill_properties
      ctx.save()
      reference_point = @get_reference_point()
      if reference_point?
        glyph_settings = reference_point
        outer_radius = @distance([reference_point],'x', 'outer_radius', 'edge')
        outer_radius = outer_radius[0]
        inner_radius = @distance([reference_point],'x', 'inner_radius', 'edge')
        inner_radius = inner_radius[0]
      else
        glyph_settings = glyph_props
      border = line_props.select(line_props.line_width_name, glyph_settings)
      d = _.min([Math.abs(x2-x1), Math.abs(y2-y1)])
      d = d - 2 * border
      r = d / 2
      if outer_radius? or inner_radius?
        ratio = r / outer_radius
        outer_radius = r
        inner_radius = inner_radius * ratio
      else
        outer_radius = r
        inner_radius = r/2
      sx = (x1 + x2) / 2.0
      sy = (y1 + y2) / 2.0
      ctx.beginPath()
      ctx.arc(sx, sy, inner_radius, 0, 2*Math.PI*2, false)
      ctx.moveTo(sx + outer_radius, sy)
      ctx.arc(sx, sy, outer_radius, 0, 2*Math.PI*2, true)
      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
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

  class Annulus extends Glyph.Model
    default_view: AnnulusView
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
    "Model": Annulus,
    "View": AnnulusView,
  }

