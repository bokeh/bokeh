
define [
  "underscore",
  "common/has_parent",
  "common/logging",
  "common/plot_widget",
  "renderer/properties"
], (_, HasParent, Logging, PlotWidget, Properties) ->

  logger = Logging.logger

  class GlyphView extends PlotWidget

    #TODO: There are glyph sub-type-vs-resample_op concordance issues...
    setup_server_data : () ->
      serversource = @mget('server_data_source')
      # hack, call set data, becuase there are some attrs that we need
      # that are in it
      data = _.extend({}, @mget('data_source').get('data'), serversource.get('data'))
      @mget('data_source').set('data', data)
      @set_data(false)

      transform_params = serversource.attributes['transform']
      resample_op = transform_params['resample']
      x_range = @plot_view.frame.get('h_range')
      y_range = @plot_view.frame.get('v_range')

      #TODO: This is weird.  For example, h_range is passed in twice.  Hugo or Joseph should clean it up
      if (resample_op == 'line1d')
        domain = transform_params['domain']
        if domain == 'x'
          serversource.listen_for_line1d_updates(
            @mget('data_source'),
            x_range,  y_range,
            @plot_view.x_range, @plot_view.y_range,
            x_range,
            @glyph_props.y.field,
            @glyph_props.x.field,
            [@glyph_props.y.field],
            transform_params
          )
        else
          throw new Error("Domains other than 'x' not supported yet.")
      else if (resample_op == 'heatmap')
        serversource.listen_for_heatmap_updates(
           @mget('data_source'),
           x_range,  y_range,
           @plot_view.x_range,
           @plot_view.y_range,
           transform_params
        )
      else if (resample_op == 'abstract rendering')
        serversource.listen_for_ar_updates(
           @plot_view
           @mget('data_source'),
             #TODO: Joseph -- Get rid of the next four params because we're passing in the plot_view
           x_range,  y_range,
           @plot_view.x_range,
           @plot_view.y_range,
           transform_params)
      else
        logger.warn("unknown resample op: '#{resample_op}'")

    initialize: (options) ->
      super(options)

      @need_set_data = true

      @glyph_props = @init_glyph(@mget('glyphspec'))

      @x_range_name = @mget('x_range_name')
      @y_range_name = @mget('y_range_name')

      @xmapper = @plot_view.frame.get('x_mappers')[@x_range_name]
      @ymapper = @plot_view.frame.get('y_mappers')[@y_range_name]

      @have_selection_props = false
      if @mget('selection_glyphspec')
        spec = _.extend({}, @mget('glyphspec'), @mget('selection_glyphspec'))
        @selection_glyphprops = @init_glyph(spec)
        @have_selection_props = true
      else
        @selection_glyphprops = @glyph_props

      if @mget('nonselection_glyphspec')
        spec = _.extend({}, @mget('glyphspec'), @mget('nonselection_glyphspec'))
        @nonselection_glyphprops = @init_glyph(spec)
        @have_selection_props = true
      else
        @nonselection_glyphprops = @glyph_props

      if @mget('server_data_source')
        @setup_server_data()
      @listenTo(this, 'change:server_data_source', @setup_server_data)

    init_glyph: (glyphspec) ->
      props = {}
      if 'line' in @_properties
        props['line_properties'] = new Properties.line_properties(@, glyphspec)
      if 'fill' in @_properties
        props['fill_properties'] = new Properties.fill_properties(@, glyphspec)
      if 'text' in @_properties
        props['text_properties'] = new Properties.text_properties(@, glyphspec)
      glyph_props = new Properties.glyph_properties(@, glyphspec, @_fields, props)
      return glyph_props

    set_data: (request_render=true) ->
      source = @mget('data_source')

      for field in @_fields
        if field.indexOf(":") > -1
          [field, junk] = field.split(":")
        @[field] = @glyph_props.source_v_select(field, source)

        # special cases
        if field == "direction"
          values = new Uint8Array(@direction.length)
          for i in [0...@direction.length]
            dir = @direction[i]
            if      dir == 'clock'     then values[i] = false
            else if dir == 'anticlock' then values[i] = true
            else values = NaN
          @direction = values

        if field.indexOf("angle") > -1
          @[field] = (-x for x in @[field])

      # any additional customization can happen here
      if @_set_data?
        t0 = Date.now()
        @_set_data()
        dt = Date.now() - t0
        type = @mget('glyphspec').type
        id = @mget("id")
        logger.debug("#{type} glyph (#{id}): custom _set_data finished in #{dt}ms")

      # just use the length of the last added field
      len = @[field].length

      @all_indices = [0...len]

      @have_new_data = true

      if request_render
        @request_render()

    render: () ->
      if @need_set_data
        @set_data(false)
        @need_set_data = false

      @_map_data()

      if @_mask_data? and (@plot_view.x_range.type != "FactorRange") and (@plot_view.y_range.type != "FactorRange")
        indices = @_mask_data()
      else
        indices = @all_indices

      ctx = @plot_view.canvas_view.ctx
      ctx.save()

      do_render = (ctx, indices, glyph_props) =>
        source = @mget('data_source')

        if @have_new_data
          if glyph_props.fill_properties? and glyph_props.fill_properties.do_fill
            glyph_props.fill_properties.set_prop_cache(source)
          if glyph_props.line_properties? and glyph_props.line_properties.do_stroke
            glyph_props.line_properties.set_prop_cache(source)
          if glyph_props.text_properties?
            glyph_props.text_properties.set_prop_cache(source)

        @_render(ctx, indices, glyph_props)

      selected = @mget('data_source').get('selected')

      t0 = Date.now()

      if selected and selected.length and @have_selection_props

        # reset the selection mask
        selected_mask = (false for i in @all_indices)
        for idx in selected
          selected_mask[idx] = true

        # intersect/different selection with render mask
        selected = new Array()
        nonselected = new Array()
        for i in indices
          if selected_mask[i]
            selected.push(i)
          else
            nonselected.push(i)

        do_render(ctx, selected, @selection_glyphprops)
        do_render(ctx, nonselected, @nonselection_glyphprops)

      else
        do_render(ctx, indices, @glyph_props)

      dt = Date.now() - t0
      type = @mget('glyphspec').type
      id = @mget("id")
      logger.trace("#{type} glyph (#{id}): do_render calls finished in #{dt}ms")

      @have_new_data = false

      ctx.restore()

    xrange: () ->
      return @plot_view.x_range

    yrange: () ->
      return @plot_view.y_range

    bind_bokeh_events: () ->
      @listenTo(@model, 'change', @request_render)
      @listenTo(@mget('data_source'), 'change', @set_data)

    distance_vector: (pt, span_prop_name, position, dilate=false) ->
      """ returns an array """
      pt_units = @glyph_props[pt].units
      span_units = @glyph_props[span_prop_name].units

      if      pt == 'x' then mapper = @xmapper
      else if pt == 'y' then mapper = @ymapper

      source = @mget('data_source')
      local_select = (prop_name) =>
        return @glyph_props.source_v_select(prop_name, source)
      span = local_select(span_prop_name)
      if span_units == 'screen'
        return span

      if position == 'center'
        halfspan = (d / 2 for d in span)
        ptc = local_select(pt)
        if pt_units == 'screen'
          ptc = mapper.v_map_from_target(ptc)
        if typeof(ptc[0]) == 'string'
          ptc = mapper.v_map_to_target(ptc)
        pt0 = (ptc[i] - halfspan[i] for i in [0...ptc.length])
        pt1 = (ptc[i] + halfspan[i] for i in [0...ptc.length])

      else
        pt0 = local_select(pt)
        if pt_units == 'screen'
          pt0 = mapper.v_map_from_target(pt0)
        pt1 = (pt0[i] + span[i] for i in [0...pt0.length])

      spt0 = mapper.v_map_to_target(pt0)
      spt1 = mapper.v_map_to_target(pt1)

      if dilate
        return (Math.ceil(Math.abs(spt1[i] - spt0[i])) for i in [0...spt0.length])
      else
        return (Math.abs(spt1[i] - spt0[i]) for i in [0...spt0.length])


    get_reference_point: () ->
      reference_point = @mget('reference_point')
      if _.isNumber(reference_point)
        return @data[reference_point]
      else
        return reference_point

    draw_legend: (ctx, x0, x1, y0, y1) ->
      null

    _generic_line_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0
      line_props = @glyph_props.line_properties
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x0, (y0 + y1) /2)
      ctx.lineTo(x1, (y0 + y1) /2)
      if line_props.do_stroke
        line_props.set_vectorize(ctx, reference_point)
        ctx.stroke()
      ctx.restore()

    _generic_area_legend: (ctx, x0, x1, y0, y1) ->
      reference_point = @get_reference_point() ? 0

      indices = [reference_point]

      w = Math.abs(x1-x0)
      dw = w*0.1
      h = Math.abs(y1-y0)
      dh = h*0.1

      sx0 = x0 + dw
      sx1 = x1 - dw

      sy0 = y0 + dh
      sy1 = y1 - dh

      if @glyph_props.fill_properties.do_fill
        @glyph_props.fill_properties.set_vectorize(ctx, reference_point)
        ctx.fillRect(sx0, sy0, sx1-sx0, sy1-sy0)

      if @glyph_props.line_properties.do_stroke
        ctx.beginPath()
        ctx.rect(sx0, sy0, sx1-sx0, sy1-sy0)
        @glyph_props.line_properties.set_vectorize(ctx, reference_point)
        ctx.stroke()

    hit_test: (geometry) ->
      result = null

      if geometry.type == "point"
        if @_hit_point?
          result = @_hit_point(geometry)
        else if not @_point_hit_warned?
          type = @mget('glyphspec').type
          logger.warn("'point' selection not available on #{type} renderer")
          @_point_hit_warned = true
      else if geometry.type == "rect"
        if @_hit_rect?
          result = @_hit_rect(geometry)
        else if not @_rect_hit_warned?
          type = @mget('glyphspec').type
          logger.warn("'rect' selection not available on #{type} renderer")
          @_rect_hit_warned = true
      else
        logger.error("unrecognized selection geometry type '#{ geometry.type }'")

      return result

  class Glyph extends HasParent

    defaults: ->
      _.extend {}, super(), {
        x_range_name: "default"
        y_range_name: "default"
        data_source: null
      }

    display_defaults: ->
      _.extend {}, super(), {
        level: 'glyph'
        radius_units: 'data'
        length_units: 'screen'
        angle_units: 'deg'
        start_angle_units: 'deg'
        end_angle_units: 'deg'
      }

  return {
    "Model": Glyph,
    "View": GlyphView
  }
