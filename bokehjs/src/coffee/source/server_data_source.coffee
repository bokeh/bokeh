
define [
  "backbone"
  "underscore"
  "common/base"
  "common/collection"
  "common/has_properties"
  "common/logging"
  "range/range1d"
  "range/data_range1d"
], (Backbone, _, base, Collection, HasProperties, Logging, Range1d, DataRange1d) ->

  logger = Logging.logger

  ajax_throttle = (func) ->
    busy = false
    resp = null
    has_callback = false
    callback = () ->
      if busy
        if has_callback
          logger.debug('already bound, ignoring')
        else
          logger.debug('busy, so doing it later')
          has_callback = true
          resp.done(() ->
            has_callback = false
            callback()
          )
      else
        logger.debug('executing')
        busy = true
        resp = func()
        resp.done(() ->
          logger.debug('done, setting to false')
          busy = false
          resp = null
        )

    return callback

  class ServerSourceUpdater extends Backbone.Model
    initialize : (attrs, options) ->
      super(attrs, options)
      @callbacks = []
      @plot_state =
        plot_x_range : options.plot_x_range
        plot_y_range : options.plot_y_range
        screen_x_range : options.screen_x_range
        screen_y_range : options.screen_y_range
      @glyph = options.glyph
      @column_data_source = options.column_data_source
      @render_state = options.render_state

    stoplistening_for_updates : () ->
      for entry in @callbacks
        @stopListening.apply(this, entry)

    listen_for_updates : () ->
      @stoplistening_for_updates()
      callback = ajax_throttle(
        () =>
          return @update()
      )
      callback()
      for param in [x_data_range, y_data_range, plot_x_range, plot_y_range]
        @listenTo(param, 'change', callback)
        @callbacks.push([param, 'change', callback])
      return null

    update : () ->
        return null

    plot_state_json : (plot_state) ->
      sendable_plot_state = {}
      for key,item of plot_state
        # This copy is to reformat a datarange1d to a range1d without
        # loosing the reference.  It is required because of weidness deserializing
        # the datarange1d on the python side.  It can't be done in just
        # plot_state becase we need the references still
        # REMOVE when DataRange1d goes away.
        proxy = new Range1d.Model()
        proxy.set('start', item.get('start'))
        proxy.set('end', item.get('end'))
        sendable_plot_state[key] = proxy
      return JSON.stringify(sendable_plot_state)

    update_url : () ->
      # TODO: better way to handle this?  the data_url is the
      # blaze compute endpoint, but we need the render endpoint here
      glyph = @glyph
      if @get('data_url')
        url = data_url
        base_url = url.replace("/compute.json", "/render")
      else
        base_url = base.Config.prefix + "render"
      url = "#{base_url}/#{docid}/#{sourceid}/#{glyphid}"
      return url

  class AbstractRenderingSource extends ServerSourceUpdater
    update : () ->
      #TODO: Share the x/y range information back to the server in some way...
      plot_state = @plot_state
      render_state = @render_state
      if not render_state
        render_state = {}
      if plot_state['screen_x'].get('start') == plot_state['screen_x'].get('end') or
         plot_state['screen_y'].get('start') == plot_state['screen_y'].get('end')
       logger.debug("skipping due to under-defined view state")
        #?! how should this be handled, returning a bogus ajax call makes no sense
       return $.ajax()
      logger.debug("Sent render State", render_state)
      resp = $.ajax(
        dataType: 'json'
        url : @update_url()
        xhrField :
          withCredentials : true
        success : (data) ->
          if data.render_state == "NO UPDATE"
            logger.info("No update")
            return
          if (domain_limit == 'auto')
            plot_state['data_x'].set(
              {start : data.x_range.start, end : data.x_range.end},
            )

            plot_state['data_y'].set(
              {start : data.y_range.start, end : data.y_range.end},
            )

          logger.debug("New render State:", data.render_state)
          new_data = _.clone(column_data_source.get('data'))  # the "clone" is a hack
          _.extend(new_data, data)
          column_data_source.set('data', new_data)
          plot_view.request_render()
        data :
          resample_parameters : JSON.stringify([input_params])
          plot_state: JSON.stringify(sendable_plot_state)
          render_state: JSON.stringify(render_state)
      )
      return resp


  class ServerDataSource extends HasProperties
    # Datasource where the data is defined column-wise, i.e. each key in the
    # the data attribute is a column name, and its value is an array of scalars.
    # Each column should be the same length.
    type: 'ServerDataSource'

    initialize : (attrs, options) =>
      super(attrs, options)
      if @get('transform')['resample'] == 'abstract rendering'
        @proxy = AbstractRenderingSource()

    listen_for_line1d_updates : (column_data_source,
                                  plot_x_span, plot_y_span,
                                  domain_span, range_span,
                                  screen_span,
                                  primary_column, domain_name, columns, input_params) ->

      plot_state = {screen_x: plot_x_span, screen_y: plot_y_span}
      #ensure we only have one set of events bound
      @stoplistening_for_updates(column_data_source)
      @line1d_update(column_data_source, plot_state, domain_span, range_span, screen_span,
                     primary_column, domain_name, columns, input_params)

      throttle = _.throttle(@line1d_update, 300)

      callback = () => throttle(column_data_source, plot_state, domain_span, range_span, screen_span,
                                primary_column, domain_name, columns, input_params)

      @listenTo(screen_span, 'change', callback)
      @listenTo(domain_span, 'change', callback)
      @callbacks[column_data_source.get('id')] = [
        [screen_span, 'change', callback],
        [domain_span, 'change', callback]
      ]

    #TODO: Move some of the passed paramters in to the plot_state object...when plot_state can handle more than just ranges
    line1d_update : (column_data_source, plot_state,
                     domain_span, range_span,
                     screen_span,
                     primary_column, domain_name, columns, input_params) =>

      domain_resolution = (screen_span.get('end') - screen_span.get('start')) / 2
      domain_resolution = Math.floor(domain_resolution)
      domain_limit = [domain_span.get('start'), domain_span.get('end')]
      range_limit = [range_span.get('start'), range_span.get('end')]

      if plot_state['screen_x'].get('start') == plot_state['screen_x'].get('end') or
         plot_state['screen_y'].get('start') == plot_state['screen_y'].get('end') or
         domain_limit[0] > domain_limit[1] or
         range_limit[0] > range_limit[1]
       return $.ajax()

      if (_.any(_.map(domain_limit, (x) -> _.isNaN(x))) or
         _.every(_.map(domain_limit, (x) -> _.isEqual(0,x))))
        domain_limit = 'auto'

      if (_.any(_.map(range_limit, (x) -> _.isNaN(x))) or
         _.every(_.map(range_limit, (x) -> _.isEqual(0,x))))
        range_limit = 'auto'

      params = [primary_column, domain_name, columns,
          domain_limit, range_limit, domain_resolution, input_params]

      $.ajax(
        dataType: 'json'
        url : @update_url()
        xhrField :
          withCredentials : true
        success : (data) ->
          if domain_limit == 'auto'
            domain_span.set(
                start : data.domain_limit[0],
                end : data.domain_limit[1],
            )

          if range_limit == 'auto'
            range_span.set(
                start : data.range_limit[0],
                end : data.range_limit[1],
            )

          column_data_source.set('data', data.data)
        data :
          resample_parameters : JSON.stringify(params)
          plot_state: JSON.stringify(plot_state)
      )


    listen_for_heatmap_updates : (column_data_source,
        plot_x_range, plot_y_range,
        x_data_range, y_data_range, input_params) ->

      plot_state = {data_x: x_data_range, data_y:y_data_range, screen_x: plot_x_range, screen_y: plot_y_range}

      #ensure we only have one set of events bound
      @stoplistening_for_updates(column_data_source)
      #throttle = _.throttle(@heatmap_update, 300)
      callback = ajax_throttle(() =>
        @heatmap_update(
          column_data_source, plot_state,
          input_params)
      )
      callback()
      @callbacks[column_data_source.get('id')] = []
      for param in [x_data_range, y_data_range, plot_x_range, plot_y_range]
        @listenTo(param, 'change', callback)
        @callbacks[column_data_source.get('id')].push([param, 'change', callback])
      @listenTo(this, 'change:index_slice', callback)
      @callbacks[column_data_source.get('id')].push(
        [this, 'change:index_slice', callback])
      @listenTo(this, 'change:data_slice', callback)
      @callbacks[column_data_source.get('id')].push(
        [this, 'change:data_slice', callback])
      return null

    heatmap_update : (column_data_source, plot_state, input_params) =>
      #TODO: Are these 'globals' really a part of plot_state?  Are they 'valid' in other plot types?
      global_x_range = @get('data').global_x_range
      global_y_range = @get('data').global_y_range
      global_offset_x = @get('data').global_offset_x[0]
      global_offset_y = @get('data').global_offset_y[0]
      index_slice = @get('index_slice')
      data_slice = @get('data_slice')

      if plot_state['screen_x'].get('start') == plot_state['screen_x'].get('end') or
         plot_state['screen_y'].get('start') == plot_state['screen_y'].get('end')
       logger.debug("skipping due to under-defined view state")
       return $.ajax()

      params = [global_x_range, global_y_range,
        global_offset_x, global_offset_y,
        index_slice, data_slice,
        @get('transpose'),
        input_params
      ]
      $.ajax(
        dataType: 'json'
        url : @update_url()
        xhrField :
          withCredentials : true
        success : (data) ->
          #hack
          new_data = _.clone(column_data_source.get('data'))
          _.extend(new_data, data)
          column_data_source.set('data', new_data)
        data :
          resample_parameters : JSON.stringify(params)
          plot_state: JSON.stringify(plot_state)
      )

  class ServerDataSources extends Collection
    model: ServerDataSource
  return {
    "Model": ServerDataSource,
    "Collection": new ServerDataSources()
  }
