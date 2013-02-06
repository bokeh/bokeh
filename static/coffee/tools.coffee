base = require("./base")
Collections = base.Collections
safebind = base.safebind
HasParent = base.HasParent
HasProperties = base.HasProperties
PlotWidget = base.PlotWidget

mapper = require("./mapper")
LinearMapper = mapper.LinearMapper


class ActiveToolManager
  """ This makes sure that only one tool is active at a time """
  constructor : (eventSink) ->
    @eventSink = eventSink
    @eventSink.active = true
    @bind_events()

  bind_events : () ->
    @eventSink.on("clear_active_tool", () =>
      @eventSink.trigger("#{@eventSink.active}:deactivated")
      @eventSink.active = true)
    @eventSink.on("active_tool", (toolName) =>
      if toolName != @eventSink.active
        @eventSink.trigger("#{toolName}:activated")
        @eventSink.trigger("#{@eventSink.active}:deactivated")
        @eventSink.active = toolName)

# FIXME : I'm not sure we need this special bind_events stuff.. I think
# we could hook in on bind_bokeh_events which is being automatically called

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
      #disable the tool when ESC is pressed
      if e.keyCode == 27
        eventSink.trigger("clear_active_tool"))

    $(document).bind('keyup', (e) =>
      if not e[@options.keyName]
        @_stop_drag())

    @plotview.main_can_wrapper.bind('mousedown', (e) =>
      if @button_activated
        @_start_drag()
        return false)

    @plotview.main_can_wrapper.bind('mouseup', (e) =>
      if @button_activated
        @_stop_drag()
        return false)

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


class OnePointWheelEventGenerator

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
    @plotview.main_can_wrapper.bind("mousewheel",
      (e, delta, dX, dY) =>
        if not @tool_active
          return
        offset = $(e.currentTarget).offset()
        e.bokehX = e.pageX - offset.left
        e.bokehY = e.pageY - offset.top
        e.delta = delta
        eventSink.trigger("#{toolName}:zoom", e)
        e.preventDefault()
        e.stopPropagation())

    $(document).bind('keydown', (e) =>
      #disable the tool when ESC is pressed
      if e.keyCode == 27
        eventSink.trigger("clear_active_tool"))

    @mouseover_count = 0
    #waiting 500 ms and testing mouseover countmakes sure that
    #mouseouts that occur because of going over element borders don't
    #trigger the mouseout
    @plotview.$el.bind("mouseout", (e) =>
      @mouseover_count -=1
      _.delay((=>
        if @mouseover_count == 0
          eventSink.trigger("clear_active_tool")), 500))

    @plotview.$el.bind("mouseover", (e) =>
      @mouseover_count += 1)

    @$tool_button = $("<button class='btn btn-small'> #{@options.buttonText} </button>")
    @plotview.$el.find('.button_bar').append(@$tool_button)

    @$tool_button.click(=>
      if @button_activated
        eventSink.trigger("clear_active_tool")
      else
        eventSink.trigger("active_tool", toolName)
        @button_activated = true)

    no_scroll = (el) ->
      el.setAttribute("old_overflow", el.style.overflow)
      el.style.overflow = "hidden"
      if el == document.body
        return
      else
        no_scroll(el.parentNode)
    restore_scroll = (el) ->
      el.style.overflow = el.getAttribute("old_overflow")
      if el == document.body
        return
      else
        restore_scroll(el.parentNode)

    eventSink.on("#{toolName}:deactivated", =>
      @tool_active=false;
      @button_activated = false;
      @$tool_button.removeClass('active')
      restore_scroll(@plotview.$el[0])
      document.body.style.overflow = @old_overflow)

    eventSink.on("#{toolName}:activated", =>
      @tool_active=true;
      @$tool_button.addClass('active')
      no_scroll(@plotview.$el[0]))

    return eventSink

class ToolView extends PlotWidget
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
      mapper = new LinearMapper({},
        data_range : datarange
        viewstate : @plot_view.viewstate
        screendim : dim)
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
        end : end)
    return null

class SelectionToolView extends ToolView
  initialize : (options) ->
    super(options)
    select_callback = _.debounce((() => @_select_data()), 50)
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
    @trigger('stopselect')
    @basepoint_set = false

  _start_selecting : (e) ->
    @trigger('startselect')
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    @mset({'start_x' : x, 'start_y' : y, 'current_x' : null, 'current_y' : null})
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
    [@xrange, @yrange] = @_get_selection_range()
    @trigger('boxselect', @xrange, @yrange)
    return null

  _select_data : () ->
    if not @basepoint_set
      return
    datasources = {}
    datasource_selections = {}
    for renderer in @mget_obj('renderers')
      datasource = renderer.get_obj('data_source')
      datasources[datasource.id] = datasource

    for renderer in @mget_obj('renderers')
      datasource_id = renderer.get_obj('data_source').id
      _.setdefault(datasource_selections, datasource_id, [])
      selected = @plot_view.renderers[renderer.id].select(@xrange, @yrange)
      datasource_selections[datasource_id].push(selected)

    for own k,v of datasource_selections
      selected = _.intersect.apply(_, v)
      datasources[k].set('selected', selected)
      console.log('selected', selected)
      datasources[k].save()
    return null


class ZoomToolView extends ToolView

  initialize : (options) ->
    super(options)
    safebind(this, @model, 'change:dataranges', @build_mappers)
    @build_mappers()

  eventGeneratorClass : OnePointWheelEventGenerator
  evgen_options : {buttonText:"Zoom"}
  tool_events : {
    zoom: "_zoom"}


  build_mappers : () =>
    @mappers = []
    for temp in _.zip(@mget_obj('dataranges'), @mget('dimensions'))
      [datarange, dim] = temp
      mapper = new LinearMapper({},
        data_range : datarange
        viewstate : @plot_view.viewstate
        screendim : dim)
      @mappers.push(mapper)
    return @mappers

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x_, y_]

  _zoom : (e) ->
    delta = e.delta
    screenX = e.bokehX
    scrrenY = e.bokehY
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
        end : end)
    return null

class PanTool extends HasParent
  type : "PanTool"
  default_view : PanToolView

PanTool::defaults = _.clone(PanTool::defaults)
_.extend(PanTool::defaults
  ,
    dimensions : [] #height/width
    dataranges : [] #references of datarange objects
)


class PanTools extends Backbone.Collection
  model : PanTool



class ZoomTool extends HasParent
  type : "ZoomTool"
  default_view : ZoomToolView
ZoomTool::defaults = _.clone(ZoomTool::defaults)
_.extend(ZoomTool::defaults
  ,
    dimensions : []
    dataranges : []
    speed : 1/600
)

class ZoomTools extends Backbone.Collection
  model : ZoomTool


class SelectionTool extends HasParent
  type : "SelectionTool"
  default_view : SelectionToolView

SelectionTool::defaults = _.clone(SelectionTool::defaults)
_.extend(SelectionTool::defaults
  ,
    renderers : []
    select_x : true
    select_y : true
    data_source_options : {} #backbone options for save on datasource
)

class SelectionTools extends Backbone.Collection
  model : SelectionTool



exports.SelectionToolView = SelectionToolView
exports.PanToolView = PanToolView
exports.ZoomToolView = ZoomToolView
exports.ActiveToolManager = ActiveToolManager

exports.pantools = new PanTools
exports.zoomtools = new ZoomTools
exports.selectiontools = new SelectionTools
