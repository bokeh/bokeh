
if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind

class PanToolView_ extends Bokeh.PlotWidget
  initialize : (options) ->
    @dragging2 = false
    @started_dragging = false
    #debugger;
    super(options)
    @dragging = false
    @started_dragging = false
    @button_activated = false

  bind_events : (plotview) ->
    @plotview = plotview
    window.ptv = @
    @plotview.moveCallbacks.push((e, x, y) =>
      the = @
      #debugger;
      if not @dragging2
        #console.log('returning because not dragging')
        return
      if not @started_dragging
        @_start_drag(e, x, y)
        @started_dragging = true
      else
        @_drag(e.foo, e.foo, e, x, y)
        e.preventDefault()
        e.stopPropagation())

  
    $(document).bind('keydown', (e) =>
      console.log(' keydown event ')
      if e.shiftKey
        @_start_drag2())
          

    $(document).bind('keyup', (e) =>
      console.log('keyup event')
      if not e.shiftKey
        @_stop_drag2())

    @plotview.main_can_wrapper.bind('mousedown', (e) =>
      if @button_activated
        @_start_drag2())

    @plotview.main_can_wrapper.bind('mouseup', (e) =>
      if @button_activated
        @_stop_drag2())
    
  _start_drag2 : ->
    if not @dragging2 
      @started_dragging = false
      @dragging2 = true
   
  _stop_drag2 : ->
    if @dragging2
      @started_dragging = false
      @dragging2 = false
  
  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x_, y_]
    

  _start_drag : (e, x, y) ->
    @dragging2 = true
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