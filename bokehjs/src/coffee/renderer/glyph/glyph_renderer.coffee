define [
  "underscore"
  "common/logging"
  "common/has_parent"
  "common/collection"
  "common/plot_widget"
], (_, Logging, HasParent, Collection, PlotWidget) ->

  logger = Logging.logger

  class GlyphRendererView extends PlotWidget

    initialize: (options) ->
      super(options)

      @selection_glyph    = @mget("selection_glyph")    or @mget("glyph")
      @nonselection_glyph = @mget("nonselection_glyph") or @mget("glyph")

      @need_set_data = true

      @x_range_name = @mget('x_range_name')
      @y_range_name = @mget('y_range_name')

      @xmapper = @plot_view.frame.get('x_mappers')[@x_range_name]
      @ymapper = @plot_view.frame.get('y_mappers')[@y_range_name]

      if @mget('server_data_source')
        @setup_server_data()
      @listenTo(this, 'change:server_data_source', @setup_server_data)

    bind_bokeh_events: () ->
      @listenTo(@model, 'change', @request_render)
      @listenTo(@mget('data_source'), 'change', @set_data)

    have_selection_glyphs: ->
      @mget("selection_glyph")? or @mget("nonselection_glyph")?

    #TODO: There are glyph sub-type-vs-resample_op concordance issues...
    setup_server_data: () ->
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
            @props.y.field,
            @props.x.field,
            [@props.y.field],
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

    set_data: (request_render=true) ->
      source = @mget('data_source')

      for field in @_fields
        if field.indexOf(":") > -1
          [field, junk] = field.split(":")
        @[field] = @props.source_v_select(field, source)

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
        glyph = @mget('glyph')
        logger.debug("#{glyph.type} glyph (#{glyph.id}): custom _set_data finished in #{dt}ms")

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

      if not (selected and selected.length and @have_selection_glyphs())
        do_render(ctx, indices, @mget("glyph"))
      else
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

        do_render(ctx, selected,    @mget("selection_glyph")    or @mget("glyph"))
        do_render(ctx, nonselected, @mget("nonselection_glyph") or @mget("glyph"))

      dt = Date.now() - t0
      glyph = @mget('glyph')
      logger.trace("#{glyph.type} glyph (#{glyph.id}): do_render calls finished in #{dt}ms")

      @have_new_data = false

      ctx.restore()

    xrange: () ->
      return @plot_view.x_range

    yrange: () ->
      return @plot_view.y_range

  class GlyphRenderer extends HasParent

    defaults: ->
      return _.extend {}, super(), {
        x_range_name: "default"
        y_range_name: "default"
        data_source: null
      }

    display_defaults: ->
      return _.extend {}, super(), {
        level: 'glyph'
        radius_units: 'data'
        length_units: 'screen'
        angle_units: 'deg'
        start_angle_units: 'deg'
        end_angle_units: 'deg'
      }

  class GlyphRenderers extends Collection
    model: GlyphRenderer

  return {
    Model: GlyphRenderer
    View: GlyphRendererView
    Collection: new GlyphRenderers()
  }
