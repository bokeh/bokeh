
if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind



class TwoPointEventGenerator

  constructor : (options) ->
    @options = options
    @toolName = @options.eventBasename
    @dragging = false
    @basepoint_set = false
    @button_activated = false
    @tool_active = false

  bind_events : (plotview, eventSink) ->
    toolName = @toolName
    @plotview = plotview
    @eventSink = eventSink
    @plotview.moveCallbacks.push((e, x, y) =>
      if not @dragging
        return
      if not @tool_active
        return
      offset = $(e.currentTarget).offset()
      e.bokehX = e.pageX - offset.left
      e.bokehY = e.pageY - offset.top
      if not @basepoint_set
        @dragging = true
        @basepoint_set = true
        eventSink.trigger("#{toolName}:SetBasepoint", e)
      else
        eventSink.trigger("#{toolName}:UpdatingMouseMove", e)
        e.preventDefault()
        e.stopPropagation())


    $(document).bind('keydown', (e) =>
      if e[@options.keyName]
        @_start_drag()
    )


    $(document).bind('keyup', (e) =>
      if not e[@options.keyName]
        @_stop_drag()
    )

    @plotview.main_can_wrapper.bind('mousedown', (e) =>
      if @button_activated
        @_start_drag()
        return false
    )
    @plotview.main_can_wrapper.bind('mouseup', (e) =>
      if @button_activated
        @_stop_drag()
        return false
    )
    @$tool_button = $("<button class='btn btn-small'> #{@options.buttonText} </button>")
    @plotview.$el.find('.button_bar').append(@$tool_button)

    @$tool_button.click(=>
      if @button_activated
        eventSink.trigger("clear_active_tool")
      else
        eventSink.trigger("active_tool", toolName)
        @button_activated = true)

    eventSink.on("#{toolName}:deactivated", =>
      @tool_active=false;
      @button_activated = false;
      @$tool_button.removeClass('active'))

    eventSink.on("#{toolName}:activated", =>
      @tool_active=true;
      @$tool_button.addClass('active'))
    return eventSink


  _start_drag : ->
    @eventSink.trigger("active_tool", @toolName)
    if not @dragging
      @dragging = true
      if not @button_activated
        @$tool_button.addClass('active')

  _stop_drag : ->
    @basepoint_set = false
    if @dragging
      @dragging = false
      if not @button_activated
        @$tool_button.removeClass('active')
      @eventSink.trigger("#{@options.eventBasename}:DragEnd")



class ToolView extends Bokeh.PlotWidget
  initialize : (options) ->
    super(options)
  bind_events : (plotview) ->
    eventSink = plotview.eventSink
    @plotview = plotview


    evgen_options = { eventBasename:@cid }

    evgen_options2 = _.extend(evgen_options, @evgen_options)
    evgen = new @eventGeneratorClass(evgen_options2)
    evgen.bind_events(plotview, eventSink)

    _.each(@tool_events, (handler_f, event_name) =>
      full_event_name = "#{@cid}:#{event_name}"
      wrap = (e) =>
        @[handler_f](e)
      eventSink.on(full_event_name, wrap))


class PanToolView extends ToolView
  initialize : (options) ->
    super(options)
    @build_mappers()

  bind_bokeh_events : () ->
    safebind(this, @model, 'change:dataranges', @build_mappers)

  build_mappers : () =>
    @mappers = []
    for temp in _.zip(@mget_obj('dataranges'), @mget('dimensions'))
      [datarange, dim] = temp
      mapper = new Bokeh.LinearMapper({},
        data_range : datarange
        viewstate : @plot_view.viewstate
        screendim : dim
      )
      @mappers.push(mapper)
    return @mappers

  eventGeneratorClass : TwoPointEventGenerator
  evgen_options : {keyName:"shiftKey", buttonText:"Pan"}
  tool_events : {
    UpdatingMouseMove: "_drag",
    SetBasepoint : "_set_base_point"}

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x_, y_]

  _set_base_point : (e) ->
    [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
    return null

  _drag : (e) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]
    for mapper in @mappers
      if mapper.screendim == 'width'
        diff = xdiff
      else
        diff = ydiff
      screenlow = 0 - diff
      screenhigh = @plot_view.viewstate.get(mapper.screendim) - diff
      [start, end] = [mapper.map_data(screenlow),
        mapper.map_data(screenhigh)]
      mapper.data_range.set(
        start : start
        end : end
      )
    return null

class SelectionToolView extends ToolView
  initialize : (options) ->
    super(options)
    select_callback = _.debounce((() => @_select_data()),50)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'change', select_callback)
    for renderer in @mget_obj('renderers')
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_obj('xdata_range'), 'change',
        @request_render)
      safebind(this, renderer.get_obj('ydata_range'), 'change',
        @request_render)
      safebind(this, renderer.get_obj('data_source'), 'change',
        @request_render)
      safebind(this, renderer, 'change', select_callback)
      safebind(this, renderer.get_obj('xdata_range'), 'change',
        select_callback)
      safebind(this, renderer.get_obj('ydata_range'), 'change',
        select_callback)
  eventGeneratorClass : TwoPointEventGenerator
  evgen_options : {keyName:"ctrlKey", buttonText:"Select"}
  tool_events : {
    UpdatingMouseMove: "_selecting",
    SetBasepoint : "_start_selecting",
    deactivated : "_stop_selecting"}


  mouse_coords : (e, x, y) ->
    [x, y] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x, y]

  _stop_selecting : () ->
    @mset(
      start_x : null
      start_y : null
      current_x : null
      current_y : null
    )
    @plotview.$el.removeClass("shading")
    for renderer in @mget_obj('renderers')
      renderer.get_obj('data_source').set('selecting', false)
      renderer.get_obj('data_source').save()
    @basepoint_set = false
    if @shading
      @shading.remove()
      @shading = null

  _start_selecting : (e) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    @mset({'start_x' : x, 'start_y' : y, 'current_x' : null, 'current_y' : null})
    for renderer in @mget_obj('renderers')
      data_source = renderer.get_obj('data_source')
      data_source.set('selecting', true)
      data_source.save()
    @basepoint_set = true

  _get_selection_range : ->
    xrange = [@mget('start_x'), @mget('current_x')]
    yrange = [@mget('start_y'), @mget('current_y')]
    if @mget('select_x')
      xrange = [d3.min(xrange), d3.max(xrange)]
    else
      xrange = null
    if @mget('select_y')
      yrange = [d3.min(yrange), d3.max(yrange)]
    else
      yrange = null
    return [xrange, yrange]

  _selecting : (e, x_, y_) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    @mset({'current_x' : x, 'current_y' : y})
    return null

  _select_data : () ->
    if not @basepoint_set
      return
    [xrange, yrange] = @_get_selection_range()
    datasources = {}
    datasource_selections = {}

    for renderer in @mget_obj('renderers')
      datasource = renderer.get_obj('data_source')
      datasources[datasource.id] = datasource

    for renderer in @mget_obj('renderers')
      datasource_id = renderer.get_obj('data_source').id
      _.setdefault(datasource_selections, datasource_id, [])
      selected = @plot_view.renderers[renderer.id].select(xrange, yrange)
      datasource_selections[datasource_id].push(selected)

    for own k,v of datasource_selections
      selected = _.intersect.apply(_, v)
      datasources[k].set('selected', selected)
      datasources[k].save()
    return null

  _render_shading : () ->
    [xrange, yrange] = @_get_selection_range()
    if _.any(_.map(xrange, _.isNullOrUndefined)) or
      _.any(_.map(yrange, _.isNullOrUndefined))
        return
    if not @shading
      @plotview.$el.addClass("shading")
    style_string = ""
    xpos = @plot_view.viewstate.rxpos(Math.min(xrange[0], xrange[1]))
    if xrange
      width = Math.abs(xrange[1] - xrange[0])
    else
      width = @plot_view.viewstate.get('width')
    style_string += "; left:#{xpos}px; width:#{width}px; "
    ypos = @plot_view.viewstate.rypos(Math.max(yrange[0], yrange[1]))
    if yrange
      height = yrange[1] - yrange[0]
    else
      height = @plot_view.viewstate.get('height')
    style_string += "top:#{ypos}px; height:#{height}px"
    @plotview.$el.find("._shader").attr('style', style_string)

  render : () ->
    super()
    @_render_shading()
    @render_end()
    return null

class ZoomToolView extends Bokeh.PlotWidget
  initialize : (options) ->
    super(options)
    safebind(this, @model, 'change:dataranges', @build_mappers)
    @build_mappers()

  build_mappers : () =>
    @mappers = []
    for temp in _.zip(@mget_obj('dataranges'), @mget('dimensions'))
      [datarange, dim] = temp
      mapper = new Bokeh.LinearMapper({},
        data_range : datarange
        viewstate : @plot_view.viewstate
        screendim : dim
      )
      @mappers.push(mapper)
    return @mappers

  bind_events : (plotview) ->
    @plotview = plotview
    $(@plotview.main_can_wrapper).bind("mousewheel", (e, delta, dX, dY) =>
        # cut and paste.. should refactor zoomtool or something
        offset = $(e.currentTarget).offset()
        e.bokehX = e.pageX - offset.left
        e.bokehY = e.pageY - offset.top
        @_zoom(e, delta, e.bokehX, e.bokehY)
        e.preventDefault()
        e.stopPropagation()
    )

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x_, y_]

  _zoom : (e, delta, screenX, screenY) ->
    [x, y] = @mouse_coords(e, screenX, screenY)
    speed = @mget('speed')
    factor = - speed  * (delta * 50)
    for mapper in @mappers
      if mapper.screendim == 'width'
        eventpos = x
      else
        eventpos = y
      screenlow = 0
      screenhigh = @plot_view.viewstate.get(mapper.screendim)
      start = screenlow - (eventpos - screenlow) * factor
      end = screenhigh + (screenhigh - eventpos) * factor
      [start, end] = [mapper.map_data(start), mapper.map_data(end)]
      mapper.data_range.set(
        start : start
        end : end
      )
    return null

Bokeh.SelectionToolView = SelectionToolView
Bokeh.PanToolView = PanToolView
Bokeh.ZoomToolView = ZoomToolView