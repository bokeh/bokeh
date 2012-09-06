
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
        @_start_drag())

    $(document).bind('keyup', (e) =>
      if not e[@options.keyName]
        @_stop_drag())

    @plotview.main_can_wrapper.bind('mousedown', (e) =>
      if @button_activated
        @_start_drag())

    @plotview.main_can_wrapper.bind('mouseup', (e) =>
      if @button_activated
        @_stop_drag())

    @pan_button = $("<button> #{@options.buttonText} </button>")
    @plotview.$el.find('.button_bar').append(@pan_button)

    @pan_button.click(=>
      if @button_activated
        eventSink.trigger("clear_active_tool")
      else
        eventSink.trigger("active_tool", toolName)
        @button_activated = true)

    eventSink.on("#{toolName}:deactivated", =>
      @tool_active=false;
      @button_activated = false;
      @pan_button.removeClass('active'))

    eventSink.on("#{toolName}:activated", =>
      @tool_active=true;
      @pan_button.addClass('active'))
    return eventSink


  _start_drag : ->
    @eventSink.trigger("active_tool", @toolName)
    if not @dragging
      @dragging = true
      if not @button_activated
        @pan_button.addClass('active')
        
  _stop_drag : ->
    @basepoint_set = false
    if @dragging
      @dragging = false
      if not @button_activated
        @pan_button.removeClass('active')
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

    
  eventGeneratorClass : TwoPointEventGenerator
  evgen_options : {keyName:"shiftKey", buttonText:"Pan Tool"}
  tool_events : {
    UpdatingMouseMove: "_drag",
    SetBasepoint : "_set_base_point"}

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x_, y_]

  _set_base_point : (e) ->
    [@x, @y] = @mouse_coords(e, e.layerX, e.layerY)
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))

  _drag_mapper : (mapper, diff) ->
    screen_range = mapper.get_ref('screen_range')
    data_range = mapper.get_ref('data_range')
    screenlow = screen_range.get('start') - diff
    screenhigh = screen_range.get('end') - diff
    [start, end] = [mapper.map_data(screenlow), mapper.map_data(screenhigh)]
    data_range.set({
      'start' : start
      'end' : end
    }, {'local' : true})

  _drag : (e) ->
    [x, y] = @mouse_coords(e, e.layerX, e.layerY)
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))
    for xmap in xmappers
      @_drag_mapper(xmap, xdiff)
    for ymap in ymappers
      @_drag_mapper(ymap, ydiff)


class SelectionToolView extends ToolView
  initialize : (options) ->
    super(options)
    select_callback = _.debounce((() => @_select_data()),50)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'change', select_callback)
    for renderer in @mget('renderers')
      renderer = @model.resolve_ref(renderer)
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_ref('xmapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('ymapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('data_source'), 'change', @request_render)
      safebind(this, renderer, 'change', select_callback)
      safebind(this, renderer.get_ref('xmapper'), 'change', select_callback)
      safebind(this, renderer.get_ref('ymapper'), 'change', select_callback)

    
  eventGeneratorClass : TwoPointEventGenerator
  evgen_options : {keyName:"ctrlKey", buttonText:"Selection Tool"}
  tool_events : {
    UpdatingMouseMove: "_selecting",
    SetBasepoint : "_start_selecting",
    deactivated : "_stop_selecting"}


  mouse_coords : (e, x, y) ->
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

  _stop_selecting : () ->
    @mset(
      start_x : null
      start_y : null
      current_x : null
      current_y : null
    )
    @plotview.$el.removeClass("shading")
    for renderer in @mget('renderers')
      @model.resolve_ref(renderer).get_ref('data_source').set('selecting', false)
      @model.resolve_ref(renderer).get_ref('data_source').save()
    @basepoint_set = false
    if @shading
      @shading.remove()
      @shading = null

  _start_selecting : (e) ->
    [x, y] = @mouse_coords(e, e.layerX, e.layerY)
    @mset({'start_x' : x, 'start_y' : y, 'current_x' : null, 'current_y' : null})
    for renderer in @mget('renderers')
      data_source = @model.resolve_ref(renderer).get_ref('data_source')
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
    [x, y] = @mouse_coords(e, e.layerX, e.layerY)
    @mset({'current_x' : x, 'current_y' : y})
    return null

  _select_data : () ->
    if not @basepoint_set
      return
    [xrange, yrange] = @_get_selection_range()
    datasources = {}
    datasource_selections = {}

    for renderer in @mget('renderers')
      datasource = @model.resolve_ref(renderer).get_ref('data_source')
      datasources[datasource.id] = datasource

    for renderer in @mget('renderers')
      datasource_id = @model.resolve_ref(renderer).get_ref('data_source').id
      _.setdefault(datasource_selections, datasource_id, [])
      selected = @model.resolve_ref(renderer).select(xrange, yrange)
      datasource_selections[datasource.id].push(selected)

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
    xpos = @plot_model.rxpos(Math.min(xrange[0], xrange[1]))
    if xrange
      width = Math.abs(xrange[1] - xrange[0])
    else
      width = @plot_model.get('width')
    style_string += "; left:#{xpos}px; width:#{width}px; "
    ypos = @plot_model.rypos(Math.max(yrange[0], yrange[1]))
    if yrange
      height = yrange[1] - yrange[0]
    else
      height = @plot_model.get('height')
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


  bind_events : (plotview) ->
    @plotview = plotview
    $(@plotview.main_can_wrapper).bind("mousewheel",
      (e, delta, dX, dY) =>
        @_zoom(e, delta, e.layerX, e.layerY))

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x_, y_]

  _zoom_mapper : (mapper, eventpos, factor) ->
    screen_range = mapper.get_ref('screen_range')
    data_range = mapper.get_ref('data_range')
    screenlow = screen_range.get('start')
    screenhigh = screen_range.get('end')
    start = screenlow - (eventpos - screenlow) * factor
    end = screenhigh + (screenhigh - eventpos) * factor
    [start, end] = [mapper.map_data(start), mapper.map_data(end)]
    data_range.set({
      'start' : start
      'end' : end
    }, {'local' : true})

  _zoom : (e, delta, screenX, screenY) ->
    [x, y] = @mouse_coords(e, screenX, screenY)
    speed = @mget('speed')
    factor = - speed  * (delta * 50)
    #debugger
    xmappers = (@model.resolve_ref(mapper) for mapper in @mget('xmappers'))
    ymappers = (@model.resolve_ref(mapper) for mapper in @mget('ymappers'))
    for xmap in xmappers
      @_zoom_mapper(xmap, x, factor)
    for ymap in ymappers
      @_zoom_mapper(ymap, y, factor)

Bokeh.SelectionToolView = SelectionToolView
Bokeh.PanToolView = PanToolView
Bokeh.ZoomToolView = ZoomToolView