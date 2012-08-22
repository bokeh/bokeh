if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind

class DeferredSVGView extends Continuum.DeferredView
  # ###class : DeferredSVGView
  # overrides make, so we create SVG elements with the appropriate namespaceURI
  # instances of this class should have some svg tagName
  tagName : 'svg'

  make: (tagName, attributes, content) ->
    el = document.createElementNS("http://www.w3.org/2000/svg", tagName)
    if (attributes)
      $(el).attr(attributes)
    if (content)
      $(el).html(content)
    return el

class PlotWidget extends DeferredSVGView
  tagName : 'g'
  initialize : (options) ->
    super(options)
    @plot_id = options.plot_id
    @plot_model = options.plot_model
    @plot_view = options.plot_view
  addPolygon: (x,y) ->
    @plot_view.ctx.fillRect(x,y,5,5)

  addCircle: (x,y) ->
    @plot_view.ctx.beginPath()

    @plot_view.ctx.arc(x, y, 5, 0, Math.PI*2)
    @plot_view.ctx.closePath()
    @plot_view.ctx.fill()
    @plot_view.ctx.stroke()
tojq = (d3selection) ->
  return $(d3selection[0][0])

# Individual Components below.
# we first define the default view for a component,
# the model for the component, and the collection

#  Plot Container


class GridPlotContainerView extends Continuum.DeferredView
  tagName : 'div'
  default_options : {
    scale:1.0
  }
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
    build_views(@model, @childviews, childspecs)

  render_deferred_components : (force) ->
    super(force)
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        @childviews[plotspec.id].render_deferred_components(force)

  render_old  : ->
    super()
    trans_string = "scale(#{@options.scale}, #{@options.scale})"
    trans_string += "translate(#{@mget('border_space')}, #{@mget('border_space')})"
    @d3plot.attr('transform', trans_string)
    d3el = d3.select(@el)
    d3el.attr('width', @options.scale * @mget('outerwidth'))
      .attr('height', @options.scale * @mget('outerheight'))
      .attr('x', @model.position_x())
      .attr('y', @model.position_y())
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
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        plot = @model.resolve_ref(plotspec)
        plot.set(
          offset : [x_coords[cidx], y_coords[ridx]]
          usedialog : false
        )

    for own key, view of @childviews
      tojq(@d3plot).append(view.$el)
    @render_end()

  render : ->
    super()
    '''
    trans_string = "scale(#{@options.scale}, #{@options.scale})"
    trans_string += "translate(#{@mget('border_space')}, #{@mget('border_space')})"
    @d3plot.attr('transform', trans_string)
    d3el = d3.select(@el)
    d3el.attr('width', @options.scale * @mget('outerwidth'))
      .attr('height', @options.scale * @mget('outerheight'))
      .attr('x', @model.position_x())
      .attr('y', @model.position_y())
    '''

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
    console.log(x_coords, y_coords)
    for row, ridx in @mget('children')
      for plotspec, cidx in row
        plot = @model.resolve_ref(plotspec)
        plot.set(
          offset : [x_coords[cidx], y_coords[ridx]]
          usedialog : false
        )

    for own key, view of @childviews
      #tojq(@d3plot).append(view.$el)
      @$el.append(view.$el)
    ab = @$el
    @render_end()


#class PlotView extends DeferredSVG
class PlotView extends Continuum.DeferredView
  default_options : {
    scale:1.0
  }

  build_renderers : ->
    build_views(@model, @renderers, @mget('renderers')
      ,
        plot_id : @id,
        plot_model : @model
        plot_view : @
    )

  build_axes : ->
    build_views(@model, @axes, @mget('axes')
      ,
        plot_id : @id
        plot_model : @model
        plot_view : @
    )

  build_tools : ->
    build_views(@model, @tools, @mget('tools')
      ,
        plot_id : @id,
        plot_model : @model
        plot_view : @
    )

  

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
    build_views(@model, @overlays, overlays
      ,
        plot_id : @id,
        plot_model : @model
        plot_view : @
    )

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
    window.e = e
    for f in @mousedownCallbacks
      f(e, e.layerX, e.layerY)


  _mousemove : (e) ->
    window.e = e
    for f in @moveCallbacks
      f(e, e.layerX, e.layerY)

  initialize : (options) ->
    super(_.defaults(options, @default_options))
    @renderers = {}
    @axes = {}
    @tools = {}
    @overlays = {}


    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()

    @moveCallbacks = []
    @mousedownCallbacks = []

    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'destroy', () => @remove())
    #@$el.attr('style', "display:block; height:300px; width:400px;")

    window.plot_el = @$el
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
    super()
    @$el.attr("width", @options.scale * @mget('outerwidth'))
      .attr('height', @options.scale * @mget('outerheight'))
    bord = @mget('border_space')
    @main_can_wrapper.attr('style', "left:#{bord}px")
    height = @mget('height')
    width = @mget('width')
    xcw = @x_can_wrapper
    @x_can_wrapper.attr('style', "left:#{bord}px; top:#{height}px; height:#{bord}px; width:#{width}px")
    @y_can_wrapper.attr('style', "width:#{bord}px; height:#{height}px;")
    @$el.find('canvas.y_can').attr('height', height).attr('width', bord)
    w = @options.scale * @mget('outerwidth')
    h = @options.scale * @mget('outerheight')
    
    @$el.attr("style", "height:#{h}px; width:#{w}px")

    @x_can_ctx = @x_can.getContext('2d')


    wh = (el, w, h) ->
      el.attr('width', w)
      el.attr('height', h)

    @y_can_ctx = @y_can.getContext('2d')
    @ctx = @canvas[0].getContext('2d')
    wh(@canvas, @mget('width'), @mget('height'))
    
    for own key, view of @axes
      @$el.append(view.$el)
    for own key, view of @renderers
      @$el.append(view.$el)

    @render_end()
  render_mainsvg : ->
    #@$el.children().detach()

    if true
      return
    
  render_deferred_components: (force) ->
    super(force)


    all_views = _.flatten(_.map([@tools, @axes, @renderers, @overlays], _.values))

    window.av = all_views
    if _.any(all_views, (v) -> v._dirty)
      @ctx.clearRect(0,0,  @mget('width'), @mget('height'))      
      for v in all_views
        v._dirty = true
        v.render_deferred_components(true)


build_views = Continuum.build_views

# D3LinearAxisView



class XYRendererView extends PlotWidget
  initialize : (options) ->
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('xmapper'), 'change', @request_render)
    safebind(this, @mget_ref('ymapper'), 'change', @request_render)
    safebind(this, @mget_ref('data_source'), 'change:data', @request_render)
    super(options)


  calc_buffer : (data) ->
    "use strict";
    xmapper = @model.get_ref('xmapper')
    ymapper = @model.get_ref('ymapper')
    xfield = @model.get('xfield')
    yfield = @model.get('yfield')
    datax = (x[xfield] for x in data)
    screenx = xmapper.v_map_screen(datax)
    screenx = @model.v_xpos(screenx)
    datay = (y[yfield] for y in data)
    screeny = ymapper.v_map_screen(datay)
    screeny = @model.v_ypos(screeny)
    #fix me figure out how to feature test for this so it doesn't use
    #typed arrays for browsers that don't support that

    @screeny = new Float32Array(screeny)
    @screenx = new Float32Array(screenx)
    #@screenx = screenx
    #@screeny = screeny

class D3LinearAxisView extends PlotWidget
  initialize : (options) ->
    super(options)
    @plotview = options.plotview
    safebind(this, @plot_model, 'change', @request_render)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @mget_ref('mapper'), 'change', @request_render)

  tagName : 'g'

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

  convert_scale : (scale) ->
    domain = scale.domain()
    range = scale.range()
    if @mget('orientation') in ['bottom', 'top']
      func = 'xpos'
    else
      func = 'ypos'
    range = [@plot_model[func](range[0]), @plot_model[func](range[1])]
    scale = d3.scale.linear().domain(domain).range(range)
    return scale


  render : ->

    super()
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
    xpos = (realX) ->
      (realX - minX)/x_scale
      
    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)

    current_tick = first_tick
    x_ticks = []
    last_tick_end = 0
    can_ctx.clearRect(0, 0,  @mget('width'), @mget('height'))
    while current_tick <= last_tick
      x_ticks.push(current_tick)
      #@plot_view.x_can_ctx.moveTo(xpos(current_tick), 0)
      text_width = can_ctx.measureText(current_tick.toString()).width
      x = (xpos(current_tick) - (text_width/2))
      if x > last_tick_end
        can_ctx.fillText(
          current_tick.toString(), x, 20)
        last_tick_end = (x + text_width) + 10
      @plot_view.ctx.moveTo(xpos(current_tick),0)
      @plot_view.ctx.lineTo(xpos(current_tick),@mget('height'))
      current_tick += interval

    can_ctx.stroke()
    @plot_view.ctx.stroke()
    @render_end()

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
    ypos = (real_y) ->
      HEIGHT - ((real_y - min_y)*y_scale) 
      
    [first_tick, last_tick] = ticks.auto_bounds(
      data_range.get('start'), data_range.get('end'), interval)

    current_tick = first_tick
    y_ticks = []
    last_tick_end = 10000
    can_ctx.clearRect(0, 0,  @mget('width'), @mget('height'))
    while current_tick <= last_tick
      y_ticks.push(current_tick)
      #@plot_view.x_can_ctx.moveTo(xpos(current_tick), 0)
      #text_width = can_ctx.measureText(current_tick.toString()).width
      text_width = 14
      y = (ypos(current_tick) - (text_width/2))
      if y < last_tick_end
        can_ctx.fillText(current_tick.toString(), 0, y)
        last_tick_end = (y + text_width) + 10
      @plot_view.ctx.moveTo(0, ypos(current_tick))
      @plot_view.ctx.lineTo(@mget('width'), ypos(current_tick))
      current_tick += interval

    can_ctx.stroke()
    @plot_view.ctx.stroke()
    @render_end()

  render_old : ->
    super()

    window.axisview = @
    node = d3.select(@el)
    node
      .attr('style', '  font: 12px sans-serif; fill:none; stroke-width:1.5px; shape-rendering:crispEdges')
      .attr('stroke', @mget('foreground_color'))
    offsets = @get_offsets(@mget('orientation'))
    offsets['h'] = @plot_model.get('height')
    node.attr('transform', "translate(#{offsets.x}, #{offsets.y})")
    
    axis = d3.svg.axis()
    ticksize = @get_tick_size(@mget('orientation'))
    scale_converted = @convert_scale(@mget_ref('mapper').get('scale'))
    temp = axis.scale(scale_converted)
    temp.orient(@mget('orientation'))
      .ticks(@mget('ticks'))
      .tickSubdivide(@mget('tickSubdivide'))
      .tickSize(ticksize)
      .tickPadding(@mget('tickPadding'))
    node.call(axis)
    node.selectAll('.tick').attr('stroke', @mget('tick_color'))
    @render_end()

class D3LinearDateAxisView extends D3LinearAxisView
  convert_scale : (scale) ->
    domain = scale.domain()
    range = scale.range()
    if @mget('orientation') in ['bottom', 'top']
      func = 'xpos'
    else
      func = 'ypos'
    range = [@plot_model[func](range[0]), @plot_model[func](range[1])]
    domain = [new Date(domain[0]), new Date(domain[1])]
    scale = d3.time.scale().domain(domain).range(range)
    return scale


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

    @plot_view.ctx.fillStyle = 'blue'
    @plot_view.ctx.strokeStyle = @mget('color')
    @plot_view.ctx.beginPath()
    if navigator.userAgent.indexOf("WebKit") != -1
      @ctx.scale(0.5, 0.5)

    @plot_view.ctx.moveTo(@screenx[0], @screeny[0])
    for idx in [1..@screenx.length]
      @plot_view.ctx.lineTo(@screenx[idx], @screeny[idx])
    @plot_view.ctx.stroke()
    @render_end()

    return null

class ScatterRendererView extends XYRendererView
  render : ->
    "use strict";
    super()
    if @model.get_ref('data_source').get('selecting') == true
        #skip data sources which are not selecting'
        @render_end()
        return null
    
    data = @model.get_ref('data_source').get('data')
    a = new Date()
    @calc_buffer(data)
    @plot_view.ctx.beginPath()
    #if navigator.userAgent.indexOf("WebKit") != -1
      #@ctx.scale(0.5, 0.5)
    if navigator.userAgent.indexOf("WebKit") != -1
      @plot_view.ctx.scale(@options.scale, @options.scale)

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
    b = new Date()
    render_time = b-a
    $('#timer').html( "render time #{render_time}")
    return null


#  tools

class PanToolView_ extends PlotWidget
  initialize : (options) ->
    @dragging = false
    super(options)

  bind_events : (plotview) ->
    @plotview = plotview
    @plotview.mousedownCallbacks.push((e, x, y) =>
      console.log('mousedown callback')
      @dragging = false)
      
    @plotview.moveCallbacks.push((e, x, y) =>
      if e.shiftKey
        if not @dragging

          @_start_drag(e, x, y)
        else
          @_drag(e.foo, e.foo, e, x, y)
          e.preventDefault()
          e.stopPropagation())

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x_, y_]
    

  _start_drag : (e, x, y) ->
    @dragging = true
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


class SelectionToolView_ extends PlotWidget
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

    #@shading.attr('fill', '#000').attr('fill-opacity', 0.1)

  render : () ->
    super()
    @_render_shading()
    @render_end()
    return null

class PanToolView extends PanToolView_
  initialize : (options) ->
    super(options)
    @selecting = false
    @button_clicked = false

  bind_events : (plotview) ->
    console.log("pantoolview bind_events")
    @plotview = plotview
    @plotview.mousedownCallbacks.push((e, x, y) =>
      if @button_panning
        @dragging = false
        @button_panning = false
      else
        @
        @_start_drag(e, x, y))

      
    @plotview.moveCallbacks.push((e, x, y) =>
      if @button_panning and @dragging
        @_drag(e.foo, e.foo, e, x, y)
        e.preventDefault()
        e.stopPropagation())
    pantool_button = $('<button> Pan Tool </button>')
    @plotview.$el.find('.button_bar').append(pantool_button)
    pantool_button.click(=>
      if @button_panning
        @dragging = false
        @button_panning = false
      else
        #@_start_drag("foo", 0, 0)
        @button_panning = true)



class SelectionToolView extends SelectionToolView_
  """this version only works via the toolbar button   """
  initialize : (options) ->
    super(options)
    @selecting = false

  bind_events : (plotview) ->
    console.log("SelectionToolView bind_events")
    @plotview = plotview
    @plotview.mousedownCallbacks.push((e, x, y) =>
      if @button_selecting
        if not @selecting
          @_start_selecting(e, x, y)
        else 
          @_stop_selecting())
      
    @plotview.moveCallbacks.push((e, x, y) =>
      if @button_selecting and @selecting
          @_selecting(e, x, y)
          e.preventDefault()
          e.stopPropagation())
    select_button = $('<button> Selction Tool </button>')
    @plotview.$el.find('.button_bar').append(select_button)
    select_button.click(=>
      if @button_selecting
        @stop_selecting()
      else
        @button_selecting = true)
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
   

class OverlayView extends PlotWidget
  initialize : (options) ->
    @rendererviews = options['rendererviews']
    super(options)

  bind_events : (plotview) ->
    @plotview = plotview
    return null

window.sel_debug = false
class ScatterSelectionOverlayView extends OverlayView
  initialize : (options) ->
    super(options)
    for renderer in @mget('renderers')
      renderer = @model.resolve_ref(renderer)
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_ref('xmapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('ymapper'), 'change', @request_render)
      safebind(this, renderer.get_ref('data_source'), 'change', @request_render)

  render : () ->
    window.overlay_render += 1
    super()
    for temp in _.zip(@mget('renderers'), @rendererviews)
      if window.sel_debug
        debugger;
      [renderer, rendererview] = temp
      renderer = @model.resolve_ref(renderer)
      selected = {}
      if renderer.get_ref('data_source').get('selecting') == false
        #skip data sources which are not selecting'
        continue
      sel_idxs = renderer.get_ref('data_source').get('selected')
      ds = renderer.get_ref('data_source')
      data = ds.get('data')
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
      ctx = @plotview.ctx
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
class ZoomToolView extends PlotWidget
  initialize : (options) ->
    super(options)

  mouse_coords : () ->
    plot = @plot_view.d3plotwindow
    [x, y] = d3.mouse(plot[0][0])
    [x, y] = [@plot_model.rxpos(x), @plot_model.rypos(y)]
    return [x, y]

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

  _zoom : () ->
    [x, y] = @mouse_coords()
    factor = - @mget('speed') * d3.event.wheelDelta
    xmappers = (@model.resolve_ref(mapper) for mapper in @mget('xmappers'))
    ymappers = (@model.resolve_ref(mapper) for mapper in @mget('ymappers'))
    for xmap in xmappers
      @_zoom_mapper(xmap, x, factor)
    for ymap in ymappers
      @_zoom_mapper(ymap, y, factor)

  bind_events : (plotview) ->
    @plotview = plotview
    node = d3.select(@plot_view.el)
    node.attr('pointer-events' , 'all')
    node.on("mousewheel.zoom"
      ,
        () =>
          @_zoom()
          d3.event.preventDefault()
          d3.event.stopPropagation()
    )

Bokeh.PlotWidget = PlotWidget
Bokeh.PlotView = PlotView
Bokeh.ScatterRendererView = ScatterRendererView
Bokeh.LineRendererView = LineRendererView
Bokeh.BarRendererView = BarRendererView
Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.PanToolView = PanToolView
Bokeh.ZoomToolView = ZoomToolView
Bokeh.SelectionToolView = SelectionToolView
Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView
Bokeh.D3LinearAxisView = D3LinearAxisView
Bokeh.D3LinearDateAxisView = D3LinearDateAxisView
