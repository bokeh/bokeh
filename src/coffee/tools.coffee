
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
    @started_dragging = false
    @button_activated = false

  bind_events : (plotview) ->
    @plotview = plotview
    @plotview.moveCallbacks.push((e, x, y) =>
      if not @draggin2
        return
      if not @started_dragging
        @_start_drag(e, x, y)
        @started_dragging = true
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
      @started_dragging = false
      @draggin2 = true
      if not @button_activated
        @pan_button.addClass('active')
   
  _stop_drag2 : ->
    if @draggin2
      @started_dragging = false
      @draggin2 = false
      if not @button_activated
        @pan_button.removeClass('active')

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x_, y_]

  #_set_base_point
  _start_drag : (e, x, y) ->
    @draggin2 = true
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

Bokeh.PanToolView = PanToolView_
