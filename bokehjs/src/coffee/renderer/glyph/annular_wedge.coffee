
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  class AnnularWedgeView extends Glyph.View

    _fields: ['x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction:string'],
    _properties: ['line', 'fill']

    _map_data: () ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      @inner_radius = @distance_vector('x', 'inner_radius', 'edge')
      @outer_radius = @distance_vector('x', 'outer_radius', 'edge')
      @angle = new Float32Array(@start_angle.length)
      for i in [0..@start_angle.length-1]
        @angle[i] = @end_angle[i] - @start_angle[i]

    _render: (ctx, glyph_props, use_selection) ->
      for i in [0..@sx.length-1]

        if isNaN(@sx[i] + @sy[i] + @inner_radius[i] + @outer_radius[i] + @start_angle[i] + @end_angle[i])
          continue
        if use_selection == true and not @selected_mask[i]
          continue
        if use_selection == false and @selected_mask[i]
          continue

        ctx.translate(@sx[i], @sy[i])
        ctx.rotate(@start_angle[i])

        ctx.moveTo(@outer_radius[i],0)
        ctx.beginPath()
        ctx.arc(0, 0, @outer_radius[i], 0, @angle[i], @direction[i])
        ctx.rotate(@angle[i])
        ctx.lineTo(@inner_radius[i], 0)
        ctx.arc(0, 0, @inner_radius[i], 0, -@angle[i], not @direction[i])
        ctx.closePath()

        ctx.rotate(-@angle[i]-@start_angle[i])
        ctx.translate(-@sx[i], -@sy[i])

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
        start_angle = -@glyph_props.select('start_angle', reference_point)
        end_angle = -@glyph_props.select('end_angle', reference_point)
      else
        glyph_settings = glyph_props
        start_angle = -0.1
        end_angle = -3.9

      angle = end_angle - start_angle
      direction = @glyph_props.select('direction', glyph_settings)
      direction = if direction == "clock" then false else true
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
      ctx.translate(sx, sy)
      ctx.rotate(start_angle)
      ctx.moveTo(outer_radius, 0)
      ctx.beginPath()
      ctx.arc(0, 0, outer_radius, 0, angle, direction)
      ctx.rotate(angle)
      ctx.lineTo(inner_radius, 0)
      ctx.arc(0, 0, inner_radius, 0, -angle, not direction)
      ctx.closePath()

      if fill_props.do_fill
        fill_props.set(ctx, glyph_settings)
        ctx.fill()
      if line_props.do_stroke
        line_props.set(ctx, glyph_settings)
        ctx.stroke()

      ctx.restore()

    ##duped
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

  class AnnularWedge extends Glyph.Model
    default_view: AnnularWedgeView
    type: 'Glyph'

    display_defaults: () ->
      return _.extend(super(), {
        direction: 'anticlock'

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
    "Model": AnnularWedge,
    "View": AnnularWedgeView,
  }
