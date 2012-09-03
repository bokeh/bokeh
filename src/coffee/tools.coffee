
if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind


class PanToolView_ extends Bokeh.PlotWidget
  # draggin2 is used because having a variable named @dragging causes some sort of naming conflict.
  # I need to look through this and figure out what is going on

  initialize : (options) ->
    super(options)
    @draggin2 = false
    @basepoint_set = false
    @button_activated = false

  bind_events : (plotview) ->
    @plotview = plotview
    @plotview.moveCallbacks.push((e, x, y) =>
      if not @draggin2
        return
      if not @basepoint_set
        @_set_base_point(e, x, y)
      else
        @_drag(e.foo, e.foo, e, x, y)
        e.preventDefault()
        e.stopPropagation())
  
    $(document).bind('keydown', (e) =>
      if e.shiftKey
        @_start_drag2())

    $(document).bind('keyup', (e) =>
      if not e.shiftKey
        @_stop_drag2())

    @plotview.main_can_wrapper.bind('mousedown', (e) =>
      if @button_activated
        @_start_drag2())

    @plotview.main_can_wrapper.bind('mouseup', (e) =>
      if @button_activated
        @_stop_drag2())

    @pan_button = $('<button> Pan Tool </button>')
    @plotview.$el.find('.button_bar').append(@pan_button)
    @pan_button.click(=>
      if @button_activated
        @button_activated = false
        @pan_button.removeClass('active')
      else
        @pan_button.addClass('active')
        @button_activated = true)

  _start_drag2 : ->
    if not @draggin2
      @draggin2 = true
      if not @button_activated
        @pan_button.addClass('active')
   
  _stop_drag2 : ->
    @basepoint_set = false
    if @draggin2
      @draggin2 = false
      if not @button_activated
        @pan_button.removeClass('active')

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x_, y_]

  _set_base_point : (e, x, y) ->
    @draggin2 = true
    @basepoint_set = true
    [@x, @y] = @mouse_coords(e, x, y)
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

  _drag : (xdiff, ydiff, e, x__, y__) ->
    if _.isUndefined(xdiff) or _.isUndefined(ydiff)
      [x, y] = @mouse_coords(e, x__, y__)
      xdiff = x - @x
      ydiff = y - @y
      [@x, @y] = [x, y]
    xmappers = (@model.resolve_ref(x) for x in @mget('xmappers'))
    ymappers = (@model.resolve_ref(x) for x in @mget('ymappers'))
    for xmap in xmappers
      @_drag_mapper(xmap, xdiff)
    for ymap in ymappers
      @_drag_mapper(ymap, ydiff)


class SelectionToolView_ extends Bokeh.PlotWidget
  initialize : (options) ->
    super(options)
    @selecting = false
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
    @draggin_2 = false
    

  bind_events : (plotview) ->
    console.log("SelectionToolView bind_events")
    @plotview = plotview
    @plotview.mousedownCallbacks.push((e, x, y) =>
      @_stop_selecting())
      
    @plotview.moveCallbacks.push((e, x, y) =>
      if e.ctrlKey or @button_selecting
        if not @selecting
          @_start_selecting(e, x, y)
        else
          @_selecting(e, x, y)
          e.preventDefault()
          e.stopPropagation())

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
    @selecting = false
    @button_selecting = false
    if @shading
      @shading.remove()
      @shading = null

  _start_selecting : (e, x_, y_) ->
    [x, y] = @mouse_coords(e, x_, y_)
    @mset({'start_x' : x, 'start_y' : y, 'current_x' : null, 'current_y' : null})
    for renderer in @mget('renderers')
      data_source = @model.resolve_ref(renderer).get_ref('data_source')
      data_source.set('selecting', true)
      data_source.save()
    @selecting = true

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
    [x, y] = @mouse_coords(e, x_, y_)
    @mset({'current_x' : x, 'current_y' : y})
    return null

  _select_data : () ->
    if not @selecting
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
Bokeh.SelectionToolView = SelectionToolView_

Bokeh.PanToolView = PanToolView_
