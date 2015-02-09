define [
  "underscore"
  "common/logging"
  "common/has_parent"
  "common/collection"
  "common/plot_widget"
  "range/factor_range"
], (_, Logging, HasParent, Collection, PlotWidget, FactorRange) ->

  logger = Logging.logger

  class GlyphRendererView extends PlotWidget

    initialize: (options) ->
      super(options)

      # XXX: this will be slow (see later in this file), perhaps reuse @glyph.
      @glyph = @build_glyph(@mget("glyph"))

      selection_glyph = @mget("selection_glyph")
      if not selection_glyph?
        selection_glyph = @mget("glyph").clone()
        selection_glyph.set(@model.selection_defaults, {silent: true})
      @selection_glyph = @build_glyph(selection_glyph)

      nonselection_glyph = @mget("nonselection_glyph")
      if not nonselection_glyph?
        nonselection_glyph = @mget("glyph").clone()
        nonselection_glyph.set(@model.nonselection_defaults, {silent: true})
      @nonselection_glyph = @build_glyph(nonselection_glyph)

      @need_set_data = true

      @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
      @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

      if @mget('server_data_source')
        @setup_server_data()
      @listenTo(this, 'change:server_data_source', @setup_server_data)

    build_glyph: (model) ->
      new model.default_view({model: model, renderer: this})

    bind_bokeh_events: () ->
      @listenTo(@model, 'change', @request_render)
      @listenTo(@mget('data_source'), 'change', @set_data)
      @listenTo(@mget('data_source'), 'select', @request_render)

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

      #TODO: Perhaps pass 'plot_view' through in the request instead of these fractions carved off
      plot_h_range = @plot_view.frame.get('h_range')
      plot_v_range = @plot_view.frame.get('v_range')
      data_x_range = @plot_view.x_range
      data_y_range = @plot_view.y_range

      #TODO: This is weird.  For example, h_range is passed in twice.  Hugo or Joseph should clean it up
      if (resample_op == 'line1d')
        domain = transform_params['domain']
        if domain == 'x'
          serversource.listen_for_line1d_updates(
            @mget('data_source'),
            plot_h_range, plot_v_range,
            data_x_range, data_y_range,
            plot_h_range,
            # XXX: @glyph.x.field (etc.) indicates this be moved to Glyph
            @glyph.glyph.y.field,
            @glyph.glyph.x.field,
            [@glyph.glyph.y.field],
            transform_params
          )
        else
          throw new Error("Domains other than 'x' not supported yet.")
      else if (resample_op == 'heatmap')
        serversource.listen_for_heatmap_updates(
           @mget('data_source'),
           plot_h_range, plot_v_range,
           data_x_range, data_y_range,
           transform_params
        )
      else if (resample_op == 'abstract rendering')
        serversource.listen_for_ar_updates(
           @plot_view
           @mget('data_source'),
             #TODO: Joseph -- Get rid of the next four params because we're passing in the plot_view
           plot_h_range, plot_v_range,
           data_x_range, data_y_range,
           transform_params)
      else
        logger.warn("unknown resample op: '#{resample_op}'")

    set_data: (request_render=true) ->
      source = @mget('data_source')
      t0 = Date.now()

      @all_indices = @glyph.set_data(source)
      @glyph._map_data()

      @_set_selection_data = () =>
        t0 = Date.now()
        @selection_glyph.set_data(source)
        @selection_glyph._map_data()

        @nonselection_glyph.set_data(source)
        @nonselection_glyph._map_data()
        dt = Date.now() - t0
        logger.debug("#{@glyph.model.type} glyph (#{@glyph.model.id}): _set_selection_data() finished in #{dt}ms")

      dt = Date.now() - t0
      logger.debug("#{@glyph.model.type} glyph (#{@glyph.model.id}): set_data() finished in #{dt}ms")

      @have_new_data = true

      if request_render
        @request_render()

    render: () ->
      if @need_set_data
        @set_data(false)
        @need_set_data = false

      # XXX: this ignores (non)selection glyphs
      if @_mask_data? and not (@plot_view.x_range instanceof FactorRange.Model) \
                      and not (@plot_view.y_range instanceof FactorRange.Model)
        indices = @_mask_data()
      else
        indices = @all_indices

      ctx = @plot_view.canvas_view.ctx
      ctx.save()

      do_render = (ctx, indices, glyph) =>
        if @have_new_data
          glyph.update_data(@mget('data_source'))
        glyph.render(ctx, indices)

      selection = @mget('data_source').get('selected')
      if selection? and selection.length > 0
        selected_indices = selection
      else
        selected_indices = []

      t0 = Date.now()

      if not (selected_indices and selected_indices.length)
        do_render(ctx, indices, @glyph)
      else
        # lazy update of (non)selection glyph data
        if @_set_selection_data?
          @_set_selection_data()
          @_set_selection_data = null

        # reset the selection mask
        selected_mask = (false for i in @all_indices)
        for idx in selected_indices
          selected_mask[idx] = true

        # intersect/different selection with render mask
        selected = new Array()
        nonselected = new Array()
        for i in indices
          if selected_mask[i]
            selected.push(i)
          else
            nonselected.push(i)

        do_render(ctx, selected,    @selection_glyph)
        do_render(ctx, nonselected, @nonselection_glyph)

      dt = Date.now() - t0
      logger.trace("#{@glyph.model.type} glyph (#{@glyph.model.id}): do_render calls finished in #{dt}ms")

      @have_new_data = false
      ctx.restore()

    xrange: () ->
      return @plot_view.x_range

    yrange: () ->
      return @plot_view.y_range

    map_to_screen: (x, x_units, y, y_units) ->
      @plot_view.map_to_screen(x, x_units, y, y_units, @mget("x_range_name"), @mget("y_range_name"))

    draw_legend: (ctx, x0, x1, y0, y1) ->
      @glyph.draw_legend(ctx, x0, x1, y0, y1)

    hit_test: (geometry) ->
      @glyph.hit_test(geometry)

  class GlyphRenderer extends HasParent
    default_view: GlyphRendererView
    type: 'GlyphRenderer'

    selection_defaults: {}
    nonselection_defaults: {fill_alpha: 0.1, line_alpha: 0.1}

    defaults: ->
      return _.extend {}, super(), {
        x_range_name: "default"
        y_range_name: "default"
        data_source: null
      }

    display_defaults: ->
      return _.extend {}, super(), {
        level: 'glyph'
      }

  class GlyphRenderers extends Collection
    model: GlyphRenderer

  return {
    Model: GlyphRenderer
    View: GlyphRendererView
    Collection: new GlyphRenderers()
  }
