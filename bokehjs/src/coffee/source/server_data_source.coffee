$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
HasProperties = require "../common/has_properties"
{logger} = require "../common/logging"
Range1d = require "../range/range1d"
DataRange1d = require "../range/data_range1d"
RemoteDataSource = require "./remote_data_source"

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
      data_x : options.data_x
      data_y : options.data_y
      screen_x : options.screen_x
      screen_y : options.screen_y
    @glyph = options.glyph
    @data_source = options.data_source
    @render_state = options.render_state
    @auto_bounds = options.data_source.get('transform')['auto_bounds']

  stoplistening_for_updates : () ->
    for entry in @callbacks
      @stopListening.apply(this, entry)

  listen_for_updates : () ->
    @stoplistening_for_updates()
    # HACK - do NOT do anything if you're interpreting
    # ranges while the bounds are auto updating
    callback = ajax_throttle(
      () =>
        return @update()
    )
    callback = _.debounce(callback, 100)
    callback()
    ranges = [@plot_state['data_x'], @plot_state['data_x'],
      @plot_state['screen_x'], @plot_state['screen_y']]
    for param in ranges
      @listenTo(param, 'change', callback)
      @callbacks.push([param, 'change', callback])
    return null

  update : () ->
      return null

  plot_state_json : () ->
    sendable_plot_state = {}
    for key,item of @plot_state
      # This copy is to reformat a datarange1d to a range1d without
      # loosing the reference.  It is required because of weidness deserializing
      # the datarange1d on the python side.  It can't be done in just
      # plot_state becase we need the references still
      # REMOVE when DataRange1d goes away.
      proxy = new Range1d.Model()
      proxy.set('start', item.get('start'))
      proxy.set('end', item.get('end'))
      sendable_plot_state[key] = proxy
    return sendable_plot_state

  update_url : () ->
    # TODO: better way to handle this?  the data_url is the
    # blaze compute endpoint, but we need the render endpoint here
    glyph = @glyph
    if @get('data_url')
      url = data_url
      base_url = url.replace("/compute.json", "/render")
    else
      # hacky - but we can't import common/base here (Circular)
      # so we use get_base instead
      base_url = glyph.get_base().Config.prefix + "render"
    docid = @glyph.get('doc')
    sourceid = @data_source.get('id')
    glyphid = glyph.get('id')
    url = "#{base_url}/#{docid}/#{sourceid}/#{glyphid}"
    return url

## Currently we can compress all these data sources into one thing...
## Should we?  unsure

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
    data =
      plot_state: @plot_state_json()
      render_state : render_state
      auto_bounds : @auto_bounds
    resp = $.ajax(
      method : 'POST'
      dataType: 'json'
      url : @update_url()
      xhrField :
        withCredentials : true
      contentType : 'application/json'
      data : JSON.stringify(data)
      success : (data) =>
        if data.render_state == "NO UPDATE"
          logger.info("No update")
          return
        if @auto_bounds
          plot_state['data_x'].set(
            {start : data.x_range.start, end : data.x_range.end},
          )

          plot_state['data_y'].set(
            {start : data.y_range.start, end : data.y_range.end},
          )
          @auto_bounds = false
        logger.debug("New render State:", data.render_state)
        new_data = _.clone(@data_source.get('data'))  # the "clone" is a hack
        _.extend(new_data, data['data'])
        @data_source.set('data', new_data)
        return null
    )
    return resp

class Line1dSource extends ServerSourceUpdater
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
    data =
      plot_state: @plot_state_json()
      render_state : render_state
      auto_bounds : @auto_bounds
    resp = $.ajax(
      method : 'POST'
      dataType: 'json'
      url : @update_url()
      xhrField :
        withCredentials : true
      contentType : 'application/json'
      data : JSON.stringify(data)
      success : (data) =>
        if data.render_state == "NO UPDATE"
          logger.info("No update")
          return
        if @auto_bounds
          plot_state['data_x'].set(
            {start : data.x_range.start, end : data.x_range.end},
          )

          plot_state['data_y'].set(
            {start : data.y_range.start, end : data.y_range.end},
          )
          @auto_bounds = false
        logger.debug("New render State:", data.render_state)
        new_data = _.clone(@data_source.get('data'))  # the "clone" is a hack
        _.extend(new_data, data['data'])
        @data_source.set('data', new_data)
        return null
    )
    return resp

class HeatmapSource extends ServerSourceUpdater
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
    data =
      plot_state: @plot_state_json()
      render_state : render_state
      auto_bounds : @auto_bounds
    resp = $.ajax(
      method : 'POST'
      dataType: 'json'
      url : @update_url()
      xhrField :
        withCredentials : true
      contentType : 'application/json'
      data : JSON.stringify(data)
      success : (data) =>
        if data.render_state == "NO UPDATE"
          logger.info("No update")
          return
        if @auto_bounds
          plot_state['data_x'].set(
            {start : data.x_range.start, end : data.x_range.end},
          )

          plot_state['data_y'].set(
            {start : data.y_range.start, end : data.y_range.end},
          )
          @auto_bounds = false
        logger.debug("New render State:", data.render_state)
        new_data = _.clone(@data_source.get('data'))  # the "clone" is a hack
        _.extend(new_data, data['data'])
        @data_source.set('data', new_data)
        return null
    )
    return resp

class ServerDataSource extends RemoteDataSource.RemoteDataSource
  # Datasource where the data is defined column-wise, i.e. each key in the
  # the data attribute is a column name, and its value is an array of scalars.
  # Each column should be the same length.
  type: 'ServerDataSource'

  initialize : (attrs, options) =>
    super(attrs, options)

  setup : (plot_view, glyph) =>
    plot_h_range =
    plot_v_range =
    data_x_range =
    data_y_range =
    options =
      data_x : plot_view.x_range
      data_y : plot_view.y_range
      screen_x : plot_view.frame.get('h_range')
      screen_y : plot_view.frame.get('v_range')
      glyph : glyph.model
    @setup_proxy(options)

  setup_proxy : (options) =>
    options['data_source'] = this
    if @get('transform')['resample'] == 'abstract rendering'
      @proxy = new AbstractRenderingSource({}, options)
    else if @get('transform')['resample'] == 'line1d'
      @proxy = new Line1dSource({}, options)
    else if @get('transform')['resample'] == 'heatmap'
      @proxy = new HeatmapSource({}, options)
    @proxy.listen_for_updates()

module.exports =
  Model: ServerDataSource