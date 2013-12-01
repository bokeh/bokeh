
define [
  "underscore",
  "renderer/properties",
  "./glyph",
], (_, Properties, Glyph) ->

  glyph_properties = Properties.glyph_properties
  line_properties  = Properties.line_properties
  fill_properties  = Properties.fill_properties

  class CircleView extends Glyph.View


    _base_glyphspec : ['x', 'y', 'radius']

    _render: (plot_view, have_new_mapper_state=true) ->
      [@sx, @sy] = @plot_view.map_to_screen(@x, @glyph_props.x.units, @y, @glyph_props.y.units)
      ds = @mget_obj('data_source')
      
      ow = @plot_view.view_state.get('outer_width')
      oh = @plot_view.view_state.get('outer_height')

      if @have_new_data or have_new_mapper_state
        @radius = @distance_vector('x', 'radius', 'edge')
        @have_new_data = false

      ow = @plot_view.view_state.get('outer_width')
      oh = @plot_view.view_state.get('outer_height')

      #this seems to do hit testing to see if the desired point is in the view screen
      for i in [0..@mask.length-1]
        outside_render_area = ((@sx[i]+@radius[i]) < 0 or (@sx[i]-@radius[i]) > ow or\
          (@sy[i]+@radius[i]) < 0 or (@sy[i]-@radius[i]) > oh)        
        if outside_render_area or isNaN(@sx[i] + @sy[i] + @radius[i])
          @mask[i] = false
        else
          @mask[i] = true
      selected = ds.get('selected')
      for idx in selected
        @selected_mask[idx] = true
      ctx = @plot_view.ctx


      ctx.save()
      if selected and selected.length and @nonselection_glyphprops
        @_full_path(ctx, @selection_glyphprops, true)
        @_full_path(ctx, @nonselection_glyphprops, false)
      else
        @_full_path(ctx, @selection_glyphprops)
      ctx.restore()

    _data_fields : []
    set_data: (request_render=true) ->
      @set_data_new(request_render)
      if request_render
        @request_render()


    _full_path: (ctx, glyph_props, use_selection) ->
      source = @mget_obj('data_source')
      glyph_props.fill_properties.set_prop_cache(source)
      glyph_props.line_properties.set_prop_cache(source)
      for i in [0..@sx.length-1]
        #if we are outside the rendering area, continue
        if not @mask[i]
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
