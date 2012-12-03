if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind


class PlotWidget extends Continuum.ContinuumView
  tagName : 'div'
  marksize : 3
  initialize : (options) ->
    @plot_id = options.plot_id
    @plot_model = options.plot_model
    @plot_view = options.plot_view
    safebind(this, @plot_view.viewstate, 'change', ()->
        console.log('CHANGE')
        @request_render()
    )
    super(options)

  addPolygon: (x,y) ->
    if isNaN(x) or isNaN(y)
      return null
    @plot_view.ctx.fillRect(x,y,@marksize,@marksize)

  addCircle: (x,y) ->
    if isNaN(x) or isNaN(y)
      return null
    @plot_view.ctx.beginPath()
    @plot_view.ctx.arc(x, y, @marksize, 0, Math.PI*2)
    @plot_view.ctx.closePath()
    @plot_view.ctx.fill()
    @plot_view.ctx.stroke()

  request_render : () ->
    @plot_view.throttled()


#  Plot Container

class GridPlotContainerView extends Continuum.ContinuumView
  tagName : 'div'
  className:"gridplot_container"
  default_options : { scale:1.0}
  set_child_view_states : () ->
    viewstates = []
    for row in @mget('children')
      viewstaterow = (@childviews[x.id].viewstate for x in row)
      viewstates.push(viewstaterow)
    @viewstate.set('childviewstates', viewstates)

  initialize : (options) ->
    super(_.defaults(options, @default_options))
    @viewstate = new Bokeh.GridViewState();
    @childviews = {}
    @build_children()
    @render()
    safebind(this, @model, 'change:children', @build_children)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @viewstate, 'change', @request_render)
    safebind(this, @model, 'destroy', () => @remove())
    return this

  build_children : ->
    childspecs = []
    for row in @mget('children')
      for x in row
        @model.resolve_ref(x).set('usedialog', false)
        childspecs.push(x)
    build_views(@model, @childviews, childspecs, {'scale': @options.scale})
    @set_child_view_states()

  render : ->
    super()
    for view in _.values(@childviews)
      view.$el.detach()
    @$el.html('')
    row_heights =  @viewstate.get('layout_heights')
    col_widths =  @viewstate.get('layout_widths')
    y_coords = [0]
    _.reduceRight(row_heights[1..]
      ,
        (x, y) ->
          val = x + y
          y_coords.push(val)
          return val
      , 0
    )
    y_coords.reverse()
    x_coords = [0]
    _.reduce(col_widths[..-1]
      ,
        (x,y) ->
          val = x + y
          x_coords.push(val)
          return val
      , 0
    )
    plot_divs = []
    last_plot = null
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        view = @childviews[plotspec.id]
        ypos = @viewstate.position_child_y(view.viewstate.get('outerheight'),
          y_coords[ridx])
        xpos = @viewstate.position_child_x(view.viewstate.get('outerwidth'),
          x_coords[cidx])
        plot_wrapper = $("<div class='gp_plotwrapper'></div>")
        plot_wrapper.attr(
          'style',
          "left:#{xpos}px; top:#{ypos}px")
        plot_wrapper.append(view.$el)
        @$el.append(plot_wrapper)
    height = @viewstate.get('outerheight')
    width = @viewstate.get('outerwidth')
    @$el.attr('style', "height:#{height}px;width:#{width}px")
    @render_end()

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

class PlotView extends Continuum.ContinuumView
  default_options : {scale:1.0}

  model_specs : ->
   {plot_id : @id, plot_model : @model, plot_view : @}

  build_renderers : ->
    build_views(@model, @renderers, @mget('renderers'),
        @model_specs(), @options)

  build_axes : ->
    build_views(@model, @axes, @mget('axes'), @model_specs(), @options)

  build_tools : ->
    build_views(@model, @tools, @mget('tools'), @model_specs())

  build_overlays : ->
    #add ids of renderer views into the overlay spec
    overlays = (_.clone(x) for x in @mget('overlays'))
    for overlayspec in overlays
      overlay = @model.resolve_ref(overlayspec)
      if not overlayspec['options']
        overlayspec['options'] = {}
      overlayspec['options']['rendererviews'] = []
      for renderer in overlay.get('renderers')
        overlayspec['options']['rendererviews'].push(@renderers[renderer.id])
    build_views(@model, @overlays, overlays, @model_specs())

  bind_overlays : ->
    for overlayspec in @mget('overlays')
      @overlays[overlayspec.id].bind_events(this)

  bind_tools : ->
    for toolspec in   @mget('tools')
      @tools[toolspec.id].bind_events(this)

  tagName : 'div'

  events :
    "mousemove .main_can_wrapper" : "_mousemove"
    "mousedown .main_can_wrapper" : "_mousedown"

  _mousedown : (e) ->
    for f in @mousedownCallbacks
      f(e, e.layerX, e.layerY)

  _mousemove : (e) ->
    for f in @moveCallbacks
      f(e, e.layerX, e.layerY)

  initialize : (options) ->
    @throttled = _.throttle(@render_deferred_components, 50)
    super(_.defaults(options, @default_options))
    height = if options.height then options.height else @mget('height')
    width = if options.width then options.width else @mget('width')
    offset = if options.offset then options.offset else @mget('offset')
    if options.border_space
      border_space = options.border_space
    else
      border_space = @mget('border_space')
    @viewstate = new Bokeh.ViewState(
      height : height
      width : width
      offset : offset
      border_space : border_space
    )
    @renderers = {}
    @axes = {}
    @tools = {}
    @overlays = {}
    @eventSink = _.extend({}, Backbone.Events)
    atm = new ActiveToolManager(@eventSink)

    @moveCallbacks = []
    @mousedownCallbacks = []
    @keydownCallbacks = []
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @render)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())
    @$el.append($("""
      <div class='button_bar'/>
      <div class='all_can_wrapper'>

        <div class='main_can_wrapper can_wrapper'>
          <div class='_shader' />
          <canvas class='main_can'></canvas>
        </div>
        <div class='x_can_wrapper can_wrapper'>
            <canvas class='x_can'></canvas>
        </div>
        <div class='y_can_wrapper can_wrapper'>
          <canvas class='y_can'></canvas>
        </div>
      </div>
      """))
    @$el.addClass("plot_wrap")
    @canvas = @$el.find('canvas.main_can')
    @x_can = @$el.find('canvas.x_can')[0]
    @y_can = @$el.find('canvas.y_can')[0]
    @main_can_wrapper = @$el.find('.main_can_wrapper')
    @x_can_wrapper = @$el.find('.x_can_wrapper')
    @y_can_wrapper = @$el.find('.y_can_wrapper')
    @render()
    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()
    @bind_tools()
    @bind_overlays()
    return this


  render : () ->
    height = @viewstate.get('height')
    width = @viewstate.get('width')
    border_space = @viewstate.get('border_space')
    outerheight = @viewstate.get('outerheight')
    outerwidth = @viewstate.get('outerwidth')
    super()
    @$el.attr("width", outerwidth)
      .attr('height', outerheight)
    bord = border_space
    xcw = @x_can_wrapper
    w = width
    h = height

    o_w = outerwidth
    o_h = outerheight
    @main_can_wrapper.attr('style', "left:#{bord}px; height:#{h}px; width:#{w}px")
    @x_can_wrapper.attr('style', "left:#{bord}px; top:#{h}px; height:#{bord}px; width:#{w}px")
    @y_can_wrapper.attr('style', "width:#{bord}px; height:#{h}px;")


    @$el.attr("style", "height:#{o_h}px; width:#{o_w}px")
    wh = (el, w, h) ->
      $(el).attr('width', w)
      $(el).attr('height',h)
    wh(@canvas, w, h)
    wh(@x_can, w, bord)
    wh(@y_can, bord, h)

    @x_can_ctx = @x_can.getContext('2d')
    @y_can_ctx = @y_can.getContext('2d')
    @ctx = @canvas[0].getContext('2d')
    @render_end()

  render_deferred_components: (force) ->
    console.log("plotview render deferred components", @constructor, new Date() - 1)
    all_views = _.flatten(_.map([@tools, @axes, @renderers, @overlays], _.values))
    @ctx.clearRect(0,0,  @viewstate.get('width'), @viewstate.get('height'))
    for v in all_views
      v.render()

build_views = Continuum.build_views
class XYRendererView extends PlotWidget
  initialize : (options) ->
    super(options)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @plot_view.viewstate, 'change', @request_render)
    safebind(this, @mget_ref('data_source'), 'change:data', @request_render)
    @set_xmapper()
    @set_ymapper()
    safebind(this, @model, 'change:xdata_range', @set_xmapper)
    safebind(this, @model, 'change:ydata_range', @set_ymapper)
    safebind(this, @mget_ref('xdata_range'), 'change', @request_render)
    safebind(this, @mget_ref('ydata_range'), 'change', @request_render)
  set_xmapper : () ->
    @xmapper = new Bokeh.LinearMapper({},
      data_range : @mget_ref('xdata_range')
      viewstate : @plot_view.viewstate
      screendim : 'width'
    )
    @request_render()

  set_ymapper: () ->
    @ymapper = new Bokeh.LinearMapper({},
      data_range : @mget_ref('ydata_range')
      viewstate : @plot_view.viewstate
      screendim : 'height'
    )
    @request_render()

  select : (xscreenbounds, yscreenbounds) ->
    if xscreenbounds
      mapper = @xmapper
      xdatabounds = [mapper.map_data(xscreenbounds[0]),
        mapper.map_data(xscreenbounds[1])]
    else
      xdatabounds = null
    if yscreenbounds
      mapper = @ymapper
      ydatabounds = [mapper.map_data(yscreenbounds[0]),
        mapper.map_data(yscreenbounds[1])]
    else
      ydatabounds = null
    func = (xval, yval) ->
      val = ((xdatabounds is null) or
        (xval > xdatabounds[0] and xval < xdatabounds[1])) and
          ((ydatabounds is null) or
          (yval > ydatabounds[0] and yval < ydatabounds[1]))
      return val
    source = @mget_ref('data_source')
    return source.select([@mget('xfield'), @mget('yfield')], func)

  calc_buffer : (data) ->
    "use strict";
    pv = @plot_view
    pvo = @plot_view.options
    own_options = @options
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')

    datax = (x[xfield] for x in data)
    screenx = @xmapper.v_map_screen(datax)
    screenx = pv.viewstate.v_xpos(screenx)

    datay = (y[yfield] for y in data)
    screeny = @ymapper.v_map_screen(datay)
    screeny = pv.viewstate.v_ypos(screeny)

    #fix me figure out how to feature test for this so it doesn't use
    #typed arrays for browsers that don't support that
    @screeny = new Float32Array(screeny)
    @screenx = new Float32Array(screenx)

class D3LinearAxisView extends PlotWidget
  initialize : (options) ->
    super(options)
    @plot_view = options.plot_view
    safebind(this, @plot_model, 'change', @request_render)
    safebind(this, @model, 'change', @request_render)
    if @mget('orientation') == 'top' or @mget('orientation') == 'bottom'
      @screendim = 'width'
    else
      @screendim = 'height'
    @set_mapper()
    safebind(this, @model, 'change:data_range', @set_mapper)
    safebind(this, @mget_ref('data_range'), 'change', @request_render)

  set_mapper : () ->
    @mapper = new Bokeh.LinearMapper({},
      data_range : @mget_ref('data_range')
      viewstate : @plot_view.viewstate
      screendim : 'height'
    )
    @request_render()

  tagName : 'div'
  get_offsets : (orientation) ->
    offsets =
      x : 0
      y : 0
    if orientation == 'bottom'
      offsets['y'] += @plot_view.viewstate.get('height')
    return offsets

  get_tick_size : (orientation) ->
    if (not _.isNull(@mget('tickSize')))
      return @mget('tickSize')
    else
      if orientation == 'bottom'
        return -@plot_view.viewstate.get('height')
      else
        return -@plot_view.viewstate.get('width')

  convert_scale : (scale) ->
    domain = scale.domain()
    range = scale.range()
    if @mget('orientation') in ['bottom', 'top']
      func = 'xpos'
    else
      func = 'ypos'
    range = [@plot_view.viewstate[func](range[0]),
      @plot_view.viewstate[func](range[1])]
    scale = d3.scale.linear().domain(domain).range(range)
    return scale

  render : ->
    super()
    unselected_color = "#ccc"
    @plot_view.ctx.fillStyle = unselected_color
    @plot_view.ctx.strokeStyle = unselected_color
    if @mget('orientation') in ['bottom', 'top']
      @render_x()
      @render_end()
      return
    @render_y()
    @render_end()
    return

  tick_label : (tick) ->
    return tick.toString()

  render_x : ->
    can_ctx = @plot_view.x_can_ctx
    data_range = @mapper.data_range
    interval = ticks.auto_interval(
      data_range.get('start'), data_range.get('end')
    )
    range = data_range.get('end') - data_range.get('start')
    x_scale = @mapper.get('scalestate')[0]
    last_tick_end = 10000
    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)
    current_tick = first_tick
    x_ticks = []
    last_tick_end = 0
    can_ctx.clearRect(0, 0,  @plot_view.viewstate.get('width'),
      @plot_view.viewstate.get('height'))
    while current_tick <= last_tick
      x_ticks.push(current_tick)
      text_width = can_ctx.measureText(@tick_label(current_tick)).width
      x = @plot_view.viewstate.xpos(@mapper.map_screen(current_tick))
      txtpos = ( x - (text_width/2))
      if txtpos > last_tick_end
        can_ctx.fillText(@tick_label(current_tick), txtpos, 20)
        last_tick_end = (txtpos + text_width) + 10
      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(x, 0)
      @plot_view.ctx.lineTo(x, @plot_view.viewstate.get('height'))
      @plot_view.ctx.stroke()
      current_tick += interval
    can_ctx.stroke()
    @render_end()

  DEFAULT_TEXT_HEIGHT : 8
  render_y : ->
    can_ctx = @plot_view.y_can_ctx
    data_range = @mapper.data_range
    interval = ticks.auto_interval(
      data_range.get('start'), data_range.get('end'))
    range = data_range.get('end') - data_range.get('start')
    y_scale = @mapper.get('scalestate')[0]
    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)
    current_tick = first_tick
    y_ticks = []
    last_tick_end = 10000
    can_ctx.clearRect(0, 0,  @plot_view.viewstate.get('width'),
      @plot_view.viewstate.get('height'))
    while current_tick <= last_tick
      y_ticks.push(current_tick)
      y = @plot_view.viewstate.ypos(@mapper.map_screen(current_tick))
      txtpos = (y + (@DEFAULT_TEXT_HEIGHT/2))
      if y < last_tick_end
        can_ctx.fillText(@tick_label(current_tick), 0, y)
        last_tick_end = (y + @DEFAULT_TEXT_HEIGHT) + 10
      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(0, y)
      @plot_view.ctx.lineTo(@plot_view.viewstate.get('width'), y)
      @plot_view.ctx.stroke()
      current_tick += interval
    can_ctx.stroke()
    @render_end()


class D3LinearDateAxisView extends D3LinearAxisView
  tick_label : (tick) ->
    start = @mget_ref('data_range').get('start')
    end = @mget_ref('data_range').get('end')
    one_day = 3600 * 24 *1000
    tick = new Date(tick)
    if (Math.abs(end - start))  > (one_day * 2)
      return tick.toLocaleDateString()
    else
      return tick.toLocaleTimeString()

class LineRendererView extends XYRendererView
  render : ->
    super()
    data = @model.get_ref('data_source').get('data')
    @calc_buffer(data)

    @plot_view.ctx.fillStyle = @mget('foreground_color')
    @plot_view.ctx.strokeStyle = @mget('foreground_color')
    @plot_view.ctx.beginPath()
    @plot_view.ctx.moveTo(@screenx[0], @screeny[0])
    for idx in [1..@screenx.length]
      x = @screenx[idx]
      y = @screeny[idx]
      if isNaN(x) or isNaN(y)
        @plot_view.ctx.stroke()
        @plot_view.ctx.beginPath()
        continue
      @plot_view.ctx.lineTo(x, y)
    @plot_view.ctx.stroke()
    @render_end()
    return null

class ScatterRendererView extends XYRendererView
  render : ->
    "use strict";
    console.log('scatter renderer render')
    super()
    if @model.get_ref('data_source').get('selecting') == true
        #skip data sources which are not selecting'
        @render_end()
        return null

    data = @model.get_ref('data_source').get('data')
    a = new Date()
    @calc_buffer(data)
    @plot_view.ctx.beginPath()
    @plot_view.ctx.fillStyle = @mget('foreground_color')
    @plot_view.ctx.strokeStyle = @mget('foreground_color')
    color_field = @mget('color_field')
    ctx = @plot_view.ctx
    m2pi = Math.PI*2
    if color_field
      color_mapper = @model.get_ref('color_mapper')
      color_arr = @model.get('color_field')
    mark_type = @mget('mark')
    for idx in [0..@screeny.length]
      if color_field
        comp_color = color_mapper.map_screen(idx)
        @plot_view.ctx.strokeStyle = comp_color
        @plot_view.ctx.fillStyle = comp_color
      if mark_type == "square"
        @addPolygon(@screenx[idx], @screeny[idx])
      else
        @addCircle(@screenx[idx], @screeny[idx])
    @plot_view.ctx.stroke()
    @render_end()
    return null

class OverlayView extends PlotWidget
  initialize : (options) ->
    @rendererviews = options['rendererviews']
    super(options)

  bind_events : (plot_view) ->
    @plot_view = plot_view
    return null

class ScatterSelectionOverlayView extends OverlayView
  initialize : (options) ->
    super(options)
    for renderer in @mget('renderers')
      renderer = @model.resolve_ref(renderer)
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_ref('xdata_range'), 'change',
        @request_render)
      safebind(this, renderer.get_ref('xdata_range'), 'change',
        @request_render)
      safebind(this, renderer.get_ref('data_source'), 'change',
        @request_render)

  render : () ->
    window.overlay_render += 1
    super()
    for renderer in @mget('renderers')
      rendererview = @plot_view.renderers[renderer.id]
      renderer = @model.resolve_ref(renderer)
      selected = {}
      if renderer.get_ref('data_source').get('selecting') == false
        #skip data sources which are not selecting'
        continue
      sel_idxs = renderer.get_ref('data_source').get('selected')
      ds = renderer.get_ref('data_source')
      data = ds.get('data')
      # hugo - i think we need to do this each time....
      # or else panning does not work
      rendererview.calc_buffer(data)
      fcolor = @mget('foreground_color')
      rvm = rendererview.model

      fcolor = rvm.get('foreground_color')
      unselected_color = @mget('unselected_color')
      color_field = rvm.get('color_field')
      if color_field
        color_mapper = rvm.get_ref('color_mapper')
      color_arr = rvm.get('color_field')
      mark_type = @mget('mark')
      last_color_field = fcolor
      @plot_view.ctx.strokeStyle = fcolor
      @plot_view.ctx.fillStyle = fcolor

      last_color_field = false
      ctx = @plot_view.ctx
      for idx in [0..data.length]
        if idx in sel_idxs
          if color_field
            comp_color = color_mapper.map_screen(idx)
            ctx.strokeStyle = comp_color
            ctx.fillStyle = comp_color
          else
            ctx.strokeStyle = fcolor
            ctx.fillStyle = fcolor
        else
          ctx.fillStyle = unselected_color
          ctx.strokeStyle = unselected_color
        if mark_type == "square"
          @addPolygon(rendererview.screenx[idx], rendererview.screeny[idx])
        else
          @addCircle(rendererview.screenx[idx], rendererview.screeny[idx])
    @plot_view.ctx.stroke()
    @render_end()
    return null
window.overlay_render = 0

Bokeh.PlotWidget = PlotWidget
Bokeh.PlotView = PlotView
Bokeh.ScatterRendererView = ScatterRendererView
Bokeh.LineRendererView = LineRendererView
Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView
Bokeh.D3LinearAxisView = D3LinearAxisView
Bokeh.D3LinearDateAxisView = D3LinearDateAxisView
