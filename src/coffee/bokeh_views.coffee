if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind


class DeferredView extends Continuum.ContinuumView
  initialize : (options) ->
    @start_render = new Date()
    @end_render = new Date()
    @render_time = 50
    @deferred_parent = options['deferred_parent']
    @request_render()
    super(options)

    @use_render_loop = options['render_loop']
    if @use_render_loop
      _.defer(() => @render_loop())

  render : () ->
    @start_render = new Date()
    super()
    @_dirty = false


  render_end : () ->
    @end_render = new Date()

    @render_time = @end_render - @start_render

  request_render : () ->
    @_dirty = true

  render_deferred_components : (force) ->
    if force or @_dirty
      @render()

  remove : () ->
    super()
    @removed = true

  render_loop : () ->
    #debugger;
    @render_deferred_components()
    if not @removed and @use_render_loop
      setTimeout((() => @render_loop()), 20)
    else
      @looping = false


Continuum.DeferredView = DeferredView


class PlotWidget extends Continuum.DeferredView
  tagName : 'div'
  marksize : 3
  initialize : (options) ->
    super(options)
    @plot_id = options.plot_id
    @plot_model = options.plot_model
    @plot_view = options.plot_view
    safebind(this, @plot_view.viewstate, 'change', ()->
        console.log('CHANGE')
        @request_render()
    )

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


#  Plot Container

class GridPlotContainerView extends Continuum.DeferredView
  tagName : 'div'
  className:"gridplot_container"
  default_options : { scale:1.0}
  initialize : (options) ->
    super(_.defaults(options, @default_options))
    @childviews = {}
    @build_children()
    @request_render()
    safebind(this, @model, 'change:children', @build_children)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'destroy', () => @remove())
    return this

  build_children : ->
    childspecs = []
    for row in @mget('children')
      for x in row
        @model.resolve_ref(x).set('usedialog', false)
        childspecs.push(x)
    build_views(@model, @childviews, childspecs, {'scale': @options.scale})

  render_deferred_components : (force) ->
    super(force)
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        @childviews[plotspec.id].render_deferred_components(force)

  render : ->
    super()

    row_heights =  @model.layout_heights()
    col_widths =  @model.layout_widths()
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
        plot = @model.resolve_ref(plotspec)
        last_plot = plot
        plot.set(
          offset : [x_coords[cidx], y_coords[ridx]]
          usedialog : false
        )
    for own_key, view of @childviews
      plot_wrapper = $("<div class='gp_plotwrapper'></div>")
      offset = view.model.get('offset')
      ypos = @options.scale * (@model.ypos(offset[1]) - view.model.get('outerheight'))
      xpos = @options.scale * offset[0]
      plot_wrapper.attr(
        'style',
        "left:#{xpos}px; top:#{ypos}px")
      plot_wrapper.append(view.$el)
      @$el.append(plot_wrapper)
      @$el.attr(
        'style',
        "height:#{@mget('height')}px; width:#{@mget('width')}px;")
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

class PlotView extends Continuum.DeferredView
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
    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()

    @moveCallbacks = []
    @mousedownCallbacks = []
    @keydownCallbacks = []
    safebind(this, @viewstate, 'change', @request_render)
    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @viewstate, 'change', @request_render)
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
    w = height
    h = width

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
    for own key, view of @axes
      @$el.append(view.$el)
    for own key, view of @renderers
      @$el.append(view.$el)
    @render_end()

  render_deferred_components: (force) ->
    super(force)
    all_views = _.flatten(_.map([@tools, @axes, @renderers, @overlays], _.values))
    if _.any(all_views, (v) -> v._dirty)
      @ctx.clearRect(0,0,  @viewstate.get('width'), @viewstate.get('height'))
      for v in all_views
        v._dirty = true
        v.render_deferred_components(true)

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
    if @mget('xmapper') == 'linear'
      @xmapper = new Bokeh.LinearMapper({},
        data_range : @mget_ref('xdata_range')
        viewstate : @plot_view.viewstate
        screendim : 'width'
      )
    @request_render()

  set_ymapper: () ->
    if @mget('ymapper') == 'linear'
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
      text_width = can_ctx.measureText(current_tick.toString()).width
      x = @plot_view.viewstate.xpos(@mapper.map_screen(current_tick))
      txtpos = ( x - (text_width/2))
      if txtpos > last_tick_end
        can_ctx.fillText(
          current_tick.toString(), txtpos, 20)
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
        can_ctx.fillText(current_tick.toString(), 0, y)
        last_tick_end = (y + @DEFAULT_TEXT_HEIGHT) + 10
      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(0, y)
      @plot_view.ctx.lineTo(@plot_view.viewstate.get('width'), y)
      @plot_view.ctx.stroke()
      current_tick += interval
    can_ctx.stroke()
    @render_end()


class D3LinearDateAxisView extends PlotWidget
  initialize : (options) ->
    super(options)
    @plot_view = options.plot_view
    safebind(this, @plot_model, 'change', @request_render)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('mapper'), 'change', @request_render)

  tagName : 'div'

  get_offsets : (orientation) ->
    offsets =
      x : 0
      y : 0
    if orientation == 'bottom'
      offsets['y'] += @plot_model.get('height')
    return offsets

  get_tick_size : (orientation) ->
    if (not _.isNull(@mget('tickSize')))
      return @mget('tickSize')
    else
      if orientation == 'bottom'
        return -@plot_model.get('height')
      else
        return -@plot_model.get('width')

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

  render_x : ->
    xmapper = @mget_ref('mapper')
    can_ctx = @plot_view.x_can_ctx
    data_range = xmapper.get_ref('data_range')
    interval = ticks.auto_interval(
      data_range.get('start'), data_range.get('end'))

    range = data_range.get('end') - data_range.get('start')
    minX = data_range.get('start')
    x_scale = range/@mget('width')

    op_scale = @plot_view.options.scale
    last_tick_end = 10000

    xpos = (realX) ->
      (((realX - minX)/x_scale) * op_scale)

    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)

    current_tick = first_tick
    x_ticks = []
    last_tick_end = 0
    can_ctx.clearRect(0, 0,  @mget('width'), @mget('height'))
    one_day = 3600 * 24 *1000
    time_string = true
    if (last_tick - first_tick)  > (one_day * 2)
      time_string = false
    console.log((last_tick - first_tick), "diff ")
    console.log(one_day, "one_day")
    console.log(2* one_day, "two_day")
    while current_tick <= last_tick
      x_ticks.push(current_tick)
      date_tick = new Date(current_tick)
      if time_string
        text_width = can_ctx.measureText(date_tick.toLocaleTimeString()).width
      else
        text_width = can_ctx.measureText(date_tick.toLocaleDateString()).width
      x = (xpos(current_tick) - (text_width/2))
      if x > last_tick_end
        ab = current_tick
        if time_string
          can_ctx.fillText(
            date_tick.toLocaleTimeString(), x, 20)
        else
          can_ctx.fillText(
            date_tick.toLocaleDateString(), x, 20)
        last_tick_end = (x + text_width) + 10

      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(xpos(current_tick), 0)
      @plot_view.ctx.lineTo(xpos(current_tick), @mget('height') * op_scale)
      @plot_view.ctx.stroke()
      current_tick += interval

    can_ctx.stroke()
    @plot_view.ctx.stroke()
    @render_end()

  DEFAULT_TEXT_HEIGHT : 8
  render_y : ->
    ymapper = @mget_ref('mapper')
    can_ctx = @plot_view.y_can_ctx

    data_range = ymapper.get_ref('data_range')
    interval = ticks.auto_interval(
      data_range.get('start'), data_range.get('end'))

    range = data_range.get('end') - data_range.get('start')
    min_y = data_range.get('start')
    HEIGHT = @mget('height')
    y_scale = HEIGHT/range
    op_scale = @plot_view.options.scale
    ypos = (real_y) ->
      (op_scale * (HEIGHT - ((real_y - min_y)*y_scale)))

    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)

    current_tick = first_tick
    y_ticks = []
    last_tick_end = 10000

    can_ctx.clearRect(0, 0,  @mget('width'), @mget('height'))
    while current_tick <= last_tick
      y_ticks.push(current_tick)
      y = (ypos(current_tick) + (@DEFAULT_TEXT_HEIGHT/2))
      if y < last_tick_end
        can_ctx.fillText(current_tick.toString(), 0, y)
        last_tick_end = (y + @DEFAULT_TEXT_HEIGHT) + 10
      @plot_view.ctx.beginPath()
      @plot_view.ctx.moveTo(0, ypos(current_tick))
      @plot_view.ctx.lineTo(@mget('width') * op_scale, ypos(current_tick))
      @plot_view.ctx.stroke()
      current_tick += interval

    can_ctx.stroke()
    @plot_view.ctx.stroke()
    @render_end()


class BarRendererView extends XYRendererView
  render_bars : (orientation) ->
    if orientation == 'vertical'
      index_mapper = @mget_ref('xmapper')
      value_mapper = @mget_ref('ymapper')
      value_field = @mget('yfield')
      index_field = @mget('xfield')
      index_coord = 'x'
      value_coord = 'y'
      index_dimension = 'width'
      value_dimension = 'height'
      indexpos = (x, width) =>
        @model.position_object_x(x, @mget('width'), width)
      valuepos = (y, height) =>
        @model.position_object_y(y, @mget('height'), height)
    else
      index_mapper = @mget_ref('ymapper')
      value_mapper = @mget_ref('xmapper')
      value_field = @mget('xfield')
      index_field = @mget('yfield')
      index_coord = 'y'
      value_coord = 'x'
      index_dimension = 'height'
      value_dimension = 'width'
      valuepos = (x, width) =>
        @model.position_object_x(x, @mget('width'), width)
      indexpos = (y, height) =>
        @model.position_object_y(y, @mget('height'), height)

    if not _.isObject(index_field)
      index_field = {'field' : index_field}
    data_source = @mget_ref('data_source')

    if _.has(index_field, index_dimension)
      thickness = index_field[index_dimension]
    else
      thickness = 0.85 * @plot_model.get(index_dimension)
      thickness = thickness / data_source.get('data').length

    left_points = []
    data_arr = @model.get_ref('data_source').get('data')
    for d, idx in data_arr
      ctr = index_mapper.map_screen(d[index_field['field']])
      left_points[idx] = indexpos(ctr - thickness / 2.0, thickness)

    height_base = value_mapper.map_screen(0)
    heights = []

    for d, idx in data_arr
      heights[idx] = value_mapper.map_screen(d[value_field])

    if orientation == "vertical"
      value_pos = (y) =>
        vp =  (@mget('height') - y)
        return vp
      for i in [0..heights.length]
        @plot_view.ctx.fillRect(left_points[i], value_pos(heights[i]), thickness, value_pos(0))
    else
      value_pos = (x) =>
        vp =  (@mget('width') - x)
        return vp

      for i in [0..heights.length]
        @plot_view.ctx.fillRect(0, left_points[i], value_pos(heights[i]), thickness)

    @plot_view.ctx.stroke()
    return null

  render : () ->
    super()
    @render_bars(@mget('orientation'))
    @render_end()
    return null


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
Bokeh.BarRendererView = BarRendererView
Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView
Bokeh.D3LinearAxisView = D3LinearAxisView
Bokeh.D3LinearDateAxisView = D3LinearDateAxisView
