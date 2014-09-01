
define [
  "underscore"
  "backbone"
  "common/has_properties"
  "common/logging"
  "range/range1d"
], (_, Backbone, HasProperties, Logging, Range1d) ->

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
  class ServerDataSource extends HasProperties
    # Datasource where the data is defined column-wise, i.e. each key in the
    # the data attribute is a column name, and its value is an array of scalars.
    # Each column should be the same length.
    type: 'ServerDataSource'

    initialize : (attrs, options) =>
      super(attrs, options)
      @callbacks = {}

    stoplistening_for_updates : (column_data_source) ->
      if @callbacks[column_data_source.get('id')]
        for entry in @callbacks[column_data_source.get('id')]
          @stopListening.apply(this, entry)

    update_url : () ->
      owner_username = @get('owner_username')
      prefix = @get_base().Config.prefix
      url = "#{prefix}bokeh/data/#{owner_username}/#{@get('doc')}/#{@get('id')}"

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

    listen_for_ar_updates : (plot_view,
                             column_data_source,
                             plot_x_range, plot_y_range,
                             x_data_range, y_data_range,
                             input_params) ->
      plot_state = {data_x: x_data_range, data_y:y_data_range, screen_x: plot_x_range, screen_y: plot_y_range}

      #TODO: Can this ar_updates be merged with line1d_updates and heatmap_updates?
      #TODO: Do we need other descriptors for AR or are these data and view parameters sufficient?
      @stoplistening_for_updates(column_data_source)
      callback =ajax_throttle( () => return @ar_update(plot_view, column_data_source, plot_state, input_params))

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


    ar_update : (plot_view, column_data_source, plot_state, input_params) ->
      #TODO: Share the x/y range information back to the server in some way...
      domain_limit = 'not auto'

      if plot_state['screen_x'].get('start') == plot_state['screen_x'].get('end') or
         plot_state['screen_y'].get('start') == plot_state['screen_y'].get('end')
       logger.debug("skipping due to under-defined view state")
       return $.ajax()

      if plot_view.x_range.get('start') == plot_view.x_range.get('end') or
         _.isNaN(plot_view.x_range.get('start')) or
         _.isNaN(plot_view.x_range.get('end')) or
         plot_view.y_range.get('start') == plot_view.y_range.get('end') or
         _.isNaN(plot_view.y_range.get('start')) or
         _.isNaN(plot_view.y_range.get('end'))
        domain_limit = 'auto'

      sendable_plot_state = {}
      for k,range of plot_state
        # This copy is to reformat a datarange1d to a range1d without
        # loosing the reference.  It is required because of weidness deserializing
        # the datarange1d on the python side.  It can't be done in just
        # plot_state becase we need the references still
        # REMOVE when DataRange1D goes away.
        proxy = new Range1d.Model()
        proxy.set('start', range.get('start'))
        proxy.set('end', range.get('end'))
        sendable_plot_state[k] = proxy

      resp = $.ajax(
        dataType: 'json'
        url : @update_url()
        xhrField :
          withCredentials : true
        success : (data) ->
          if (domain_limit == 'auto')
            plot_state['data_x'].set(
              {start : data.x_range.start, end : data.x_range.end},
            )

            plot_state['data_y'].set(
              {start : data.y_range.start, end : data.y_range.end},
            )


          #hack
          new_data = _.clone(column_data_source.get('data'))
          _.extend(new_data, data)
          column_data_source.set('data', new_data)
          plot_view.request_render()
        data :
          resample_parameters : JSON.stringify([input_params])
          plot_state: JSON.stringify(sendable_plot_state)
      )
      return resp


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

  class ServerDataSources extends Backbone.Collection
    model: ServerDataSource
  return {
    "Model": ServerDataSource,
    "Collection": new ServerDataSources()
  }
