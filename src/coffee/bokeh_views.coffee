if this.Bokeh
  Bokeh = this.Bokeh
else
  Bokeh = {}
  this.Bokeh = Bokeh
safebind = Continuum.safebind

# ###class : PlotWidget
class PlotWidget extends Continuum.ContinuumView
  # Everything that lives inside a plot container should
  # inherit from this class.  All plot widgets are
  # passed in the plot model and view
  # This class also contains some basic canvas rendering primitives
  # we also include the request_render function, which
  # calls a throttled version of the plot canvas rendering function
  tagName : 'div'
  marksize : 3
  initialize : (options) ->
    @plot_model = options.plot_model
    @plot_view = options.plot_view
    super(options)

  bind_bokeh_events : ->
    safebind(this, @plot_view.viewstate, 'change', ()->
        @request_render())

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


#  ###class : GridPlotContainerView

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
    return this

  bind_bokeh_events : ->
    safebind(this, @model, 'change:children', @build_children)
    safebind(this, @model, 'change', @render)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())

  #FIXME make binding of this style equivalent to above safebind calls
  # document semantics of when these events should be bound
  #bokeh events
  b_events : {
    "change:children model" : "build_children",
    "change model":           "render",
    "change viewstate"      : "render",
    "destroy model"         : "remove"}


  build_children : ->
    childmodels = []
    for row in @mget_obj('children')
      for plot in row
        childmodels.push(plot)
    build_views(@childviews, childmodels, {})
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

  view_options : ->
    _.extend({plot_model : @model, plot_view : @}, @options)

  build_renderers : ->
    console.log('before')
    build_views(@renderers, @mget_obj('renderers'), @view_options())
    console.log('after')

  build_axes : ->
    build_views(@axes, @mget_obj('axes'), @view_options())

  build_tools : ->
    #build_views(@model, @tools, @mget('tools'), @model_specs())
    build_views(@tools, @mget_obj('tools'), @view_options())

  build_overlays : ->
    #add ids of renderer views into the overlay spec
    build_views(@overlays, @mget_obj('overlays'), @view_options())

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
    @render_init()
    @render()
    @build_subviews()
    return this
  render_init : () ->
    #FIXME template
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

  build_subviews : ()->
    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()
    @bind_tools()
    @bind_overlays()


  bind_bokeh_events : () ->
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @render)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())


  # FIXME document throughly when render is called vs render_deferred
  # should we have a "render_init" "render" and a
  # "render_canvas" function add_dom is called at instatiation.
  # "render" is called for plot resizing.  render_canvas is called
  # when changes to the canvas are desired.  A ScatterRendererView
  # would only have a "render_canvas function

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
    #console.log("plotview render deferred components", @constructor, new Date() - 1)
    all_views = _.flatten(_.map([@tools, @axes, @renderers, @overlays], _.values))
    @ctx.clearRect(0,0,  @viewstate.get('width'), @viewstate.get('height'))
    for v in all_views
      v.render()

build_views = Continuum.build_views

# ###class : XYRendererView
class XYRendererView extends PlotWidget
  # This class is the base class for  all 2d renderers
  # half of it is for setting up mappers,
  # The other half (`@select`,  and `@calc_buffer`)
  # only make sense for our schema based renderers
  # (line/scatter) because the glyph renderer allows
  # for specifying data space and
  # screen space offsets, which aren't handled in those methods.
  # so we probably need to split this up somehow

  initialize : (options) ->
    super(options)
    @set_xmapper()
    @set_ymapper()

  bind_bokeh_events : () ->
    safebind(this, @model, 'change', @request_render)
    safebind(this, @plot_view.viewstate, 'change', @request_render)
    safebind(this, @mget_obj('data_source'), 'change:data', @request_render)
    safebind(this, @model, 'change:xdata_range', @set_xmapper)
    safebind(this, @model, 'change:ydata_range', @set_ymapper)
    safebind(this, @mget_obj('xdata_range'), 'change', @request_render)
    safebind(this, @mget_obj('ydata_range'), 'change', @request_render)

  set_xmapper : () ->
    @xmapper = new Bokeh.LinearMapper({},
      data_range : @mget_obj('xdata_range')
      viewstate : @plot_view.viewstate
      screendim : 'width'
    )
    @request_render()

  set_ymapper: () ->
    @ymapper = new Bokeh.LinearMapper({},
      data_range : @mget_obj('ydata_range')
      viewstate : @plot_view.viewstate
      screendim : 'height'
    )
    @request_render()
  # ### method : XYRendererView::select
  select : (xscreenbounds, yscreenbounds) ->
    # given x/y screen coordinates, select
    # points on the data source that fall within
    # these bounds.  This does not work for glyph
    # based renderers
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
    source = @mget_obj('data_source')
    return source.select([@mget('xfield'), @mget('yfield')], func)

  # ### method : XYRendererView::calc_buffer

  calc_buffer : (data) ->
    # calculates screen coordinates for data.  Only works
    # for schema based renderers(line/scatter)
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

    @screeny = screeny
    @screenx = screenx

class LinearAxisView extends PlotWidget
  initialize : (options) ->
    super(options)
    @plot_view = options.plot_view
    if @mget('orientation') == 'top' or @mget('orientation') == 'bottom'
      @screendim = 'width'
    else
      @screendim = 'height'
    @set_mapper()

  bind_bokeh_events : () ->
    safebind(this, @plot_model, 'change', @request_render)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'change:data_range', @set_mapper)
    safebind(this, @mget_obj('data_range'), 'change', @request_render)

  set_mapper : () ->
    @mapper = new Bokeh.LinearMapper({},
      data_range : @mget_obj('data_range')
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

class LinearDateAxisView extends LinearAxisView
  tick_label : (tick) ->
    start = @mget_obj('data_range').get('start')
    end = @mget_obj('data_range').get('end')
    one_day = 3600 * 24 *1000
    tick = new Date(tick)
    if (Math.abs(end - start))  > (one_day * 2)
      return tick.toLocaleDateString()
    else
      return tick.toLocaleTimeString()

class LineRendererView extends XYRendererView
  render : ->
    super()
    data = @model.get_obj('data_source').get('data')
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


class MetaGlyph
  constructor: (@attrnames, @glyphspec, @styleprovider) ->
    # * attrnames: a list of attribute names. They can have an optional type
    #     suffix, separated by a colon, where the type string can be
    #     `'number'`, `'string'`, or `'array'`. The default is `'number'`.
    #     These types determine how to interpret values in the glyphspec.
    #     For `number` and `array` fields, if a string is provided, then it is
    #     treated as a field name specifier. For `string` fields, a string is
    #     treated as a default value. For `array` fields, any non-array literal
    #     value is wrapped into a single-element array.
    # * glyphspec: the glyph specification object, usually defined in the
    #     `glyphs` field of a GlyphRenderer
    # * styleprovider: something with an `.mget()` method that can produce
    #     a concrete value (or fieldname) for each of the attributes

  make_glyph: (datapoint) ->
    # Returns an object that has properties corresponding all of the named
    # attributes in `attrnames`, as well as $NAME_units. (The latter is a
    # string, usually `'data'` or `'screen'`, but in some cases can be actual
    # mathematical units like deg/rad.)
    glyph = {}
    for attrname in @attrnames
      if attrname.indexOf(":") > -1
        [attrname, attrtype] = attrname.split(":")
      else
        attrtype = "number"

      if not (attrname of @glyphspec)
        # The field is absent from the glyph specification.
        # Just read defaults from the styleprovider. The default value of
        # `units` is always `'data'`.
        glyph[attrname] = @styleprovider.mget(attrname)
        glyph[attrname+'_units'] = 'data'
        continue
      
      else if _.isNumber(@glyphspec[attrname])
        # The glyph specification provided a number. This is always a
        # default value.
        glyph[attrname] = if attrname of datapoint then datapoint[attrname] else @glyphspec[attrname]
        glyph[attrname+'_units'] = 'data'
        continue

      else
        if _.isString(@glyphspec[attrname])
          # The glyph specification provided a string for this field; how we
          # interpret it depends on the type of the field.
          # For string fields, this becomes the field value.  For all others,
          # treat this as customizing the name of the field.
          if attrtype == 'string'
            default_value = @glyphspec[attrname]
            fieldname = attrname
          else
            default_value = @styleprovider.mget(attrname)
            fieldname = @glyphspec[attrname]
          # In either case, use the default units
          glyph[attrname+'_units'] = 'data'
        
        else if _.isObject(@glyphspec[attrname])
          obj = @glyphspec[attrname]
          fieldname = if obj.field? then obj.field else attrname
          default_value = if obj.default? then obj.default else @styleprovider.mget(attrname)
          glyph[attrname+'_units'] = if obj.units? then obj.units else 'data'

        else 
          # This is an error down here...
          console.log("Unknown glyph specification value type.")
          continue

        # Both string and object glyphspecs share this logic
        if fieldname of datapoint
          glyph[attrname] = datapoint[fieldname]
        else
          glyph[attrname] = default_value

    return glyph

# ###class : GlyphRendererView
class GlyphRendererView extends XYRendererView
  addSquare: (x, y, size, color) ->
    if isNaN(x) or isNaN(y)
      return null
    @plot_view.ctx.fillStyle = color
    @plot_view.ctx.strokeStyle = color
    @plot_view.ctx.fillRect(x - size / 2, y - size / 2, size, size)

  addCircle: (x, y, size, color) ->
    if isNaN(x) or isNaN(y)
      return null
    @plot_view.ctx.fillStyle = color
    @plot_view.ctx.strokeStyle = color
    @plot_view.ctx.beginPath()
    @plot_view.ctx.arc(x, y, size/2, 0, Math.PI*2)
    @plot_view.ctx.closePath()
    @plot_view.ctx.fill()
    @plot_view.ctx.stroke()

  # ### method : GlyphRendererView::calc_screen
  calc_screen : (glyph, direction, datapoint, mapper) ->
    # #### Parameters
    # * glyph : one glyph such as  @mget('glyphs')[0]
    # * direction : 'x' or 'y'
    # * datapoint : one record from the data source, as a dictionary
    # * mapper : the mapper which pertains to dim
    # #### Returns
    # * screen coordinate

    # get dim, first from the glyph, otherwise from the glyph
    # renderer model. dims can either be strings to specify the field name
    # `"x"`, or `"stockprice"`, or they can be an array
    # `["stockprice", 0.10, 0.20]`  If the dim is an array, the
    # first element is the field name, and the 2 floats are
    # data space offset and screen space offset for the glyph

    dim = if glyph[direction] then glyph[direction] else @mget(direction)
    if _.isArray(dim)
      data = datapoint[dim[0]]
      data = if dim[1] then dim[1] + data else data
      screenoffset = if dim[2] then dim[2] else 0
    else
      data = datapoint[dim]
      screenoffset = 0
    if dim == 'x'
      screenoffset = screenoffset * @plot_view.viewstate.get('width')
    else
      screenoffset = screenoffset * @plot_view.viewstate.get('height')
    screen = mapper.map_screen(data) + screenoffset
    return screen

  render_scatter : (glyph, data) ->
    datapoint = data[glyph.index]
    screenx = @calc_screen(glyph, 'x', datapoint, @xmapper)
    screeny = @calc_screen(glyph, 'y', datapoint, @ymapper)
    size = if glyph.size then glyph.size else @mget('scatter_size')
    color = if glyph.color then glyph.color else @mget('color')
    if glyph.type == 'circle'
      @addCircle(screenx, screeny, size, color)
    if glyph.type == 'square'
      @addSquare(screenx, screeny, size, color)

  render : ->
    screen_glpyhs = []
    data = @mget_obj('data_source').get('data')
    for glyph in @mget('glyphs')
      if glyph.type == 'circle' or glyph.type == 'square'
        @render_scatter(glyph, data)
      else if glyph.type == 'circles'
        @render_circles(glyph, data)
      else if glyph.type == 'rects'
        @new_render_rects(glyph, data)
      else if glyph.type == 'line'
        'pass'

  render_circles : (glyph, data) ->
    # ### Fields of the 'circles' glyph:
    # * xfield, yfield: names of the data fields that contain the center
    #     positions. Defaults to 'x' and 'y'.
    # * radiusfield: name of the data field indicating the radius (in screen pixels). 
    #     Defaults to 'radius'.
    # * colorfield: name of data field indicating the color of each point. Defaults
    #     to 'color'.
    # * radius: a fixed radius (in screen pixels) to use for every point. Used
    #     if a particular datapoint does not define the property named by
    #     'radiusfield'.
    # * color: a fixed color to use for every point. Use if a particular
    #     datapoint does not define the property named by 'colorfield'.
    #
    # Only one of 'radius' and 'radiusfield' need to be specified.  If both are
    # specified, then the value from 'radiusfield' for each datapoint overrides
    # the constant value in 'radius'. The same applies to 'color'/'colorfield'.
    
    # Look up the field names from the glyph spec or the GlyphRenderer model
    # defaults, and cache them
    radiusfield = if glyph.radiusfield? then glyph.radiusfield else @mget('radiusfield')
    colorfield = if glyph.colorfield? then glyph.colorfield else @mget('colorfield')
    xfield = if glyph.xfield? then glyph.xfield else @mget('xfield')
    yfield = if glyph.yfield? then glyph.yfield else @mget('yfield')

    for datapoint in data
      # Instead of calling @calc_screen and supporting offsets, we just bake
      # that logic into the loop here.
      screenx = @xmapper.map_screen(datapoint[xfield])
      screeny = @ymapper.map_screen(datapoint[yfield])
      if radiusfield of datapoint
        # Look up the radius to use from this datapoint
        size = datapoint[radiusfield]
      else
        # Use a default radius (either from the glyph or the glyph defaults)
        size = if glyph.radius? then glyph.radius else @mget('radius')

      if colorfield of datapoint
        # Look up the color to use from this datapoint
        color = datapoint[colorfield]
      else
        # Use a default color (either from the glyph or the glyph defaults)
        color = if glyph.color? then glyph.color else @mget('color')
      @addCircle(screenx, screeny, size, color)

  new_render_rects : (glyphspec, data) ->
    # Create custom getter functions for each parameter
    # TODO: Replace this and @_build_getters with a Glyph class
    if glyphspec.x?   # use centers, widths, heights
      params = ['x','y','width','height']
    else if glyphspec.left?   # use bounds
      params = ['left','right','bottom','top']
    
    params.push.apply(params, ["angle","color:color", "bordercolor:color","alpha"])
    metaglyph = new MetaGlyph(params, glyphspec, this)

    @plot_view.ctx.save()
    for datapoint in data
      glyph = metaglyph.make_glyph(datapoint)
      if glyphspec.x?
        [left,right,h_units] = @_span2bounds(glyph.x, glyph.x_units, glyph.width, glyph.width_units, @xmapper)
        if h_units == 'data'
          left = @xmapper.map_screen(left)
          right = @xmapper.map_screen(right)
        [bottom,top,v_units] = @_span2bounds(glyph.y, glyph.y_units, glyph.height, glyph.height_units, @ymapper)
        if v_units == 'data'
          bottom = @ymapper.map_screen(bottom)
          top = @ymapper.map_screen(top)
      else
        # Glyph is specifying bounds, so transform to screen space (if
        # necessary)
        if glyph.left_units == 'data'
          left = @xmapper.map_screen(glyph.left)
        if glyph.right_units == 'data'
          right = @xmapper.map_screen(glyph.right)
        if glyph.bottom_units == 'data'
          bottom = @ymapper.map_screen(glyph.bottom)
        if glyph.top_units == 'data'
          top = @ymapper.map_screen(glyph.top)
      
      # At this point, we have the box boundaries (left, right, bottom, top)
      # in screen space coordinates, and should be ready to draw.
      
      # In the following, we need to grab the first element of the returned
      # valued b/c getter functions always return (val, units) and we don't
      # care about units for color.
      ctx = @plot_view.ctx
      ctx.globalAlpha = glyph.alpha
      if glyph.fillcolor != "none"
        ctx.fillStyle = glyph.fillcolor
        ctx.fillRect(left, bottom, right-left, top-bottom)
      if glyph.strokecolor != "none"
        ctx.strokeStyle = glyph.strokecolor
        ctx.rect(left, bottom, right-left, top-bottom)
      # End per-datapoint loop

    # Done with all drawing, restore the graphics state
    @plot_view.ctx.restore()
    return      # render_rects()


  render_rects : (glyphspec, data) ->
    # ### Fields of the 'rects' glyph
    # There are two ways to specify rects: Centers & widths & heights, or 
    # boundaries.  If both types are specified, then the behavior is 
    # implementation dependent and should not be relied upon.
    #
    # ## Spatial parameters
    # * x, y, width, height
    # * left, right, bottom, top
    # * angle
    #
    # For each of these spatial parameters, the full specification in the
    # glyph is an embedded object with the following properties:
    # * field: the name of the field in each data point; this defaults to
    #     the name of the spatial parameter itself (e.g. 'height', 'bottom', 'x')
    # * default: a numerical default value to use if the field does not exist
    #     on a datapoint.  Each spatial parameter also has a global default
    #     value (defined in GlyphRenderer::display_defaults)
    # * units: For all parameters except 'angle', this specifies the coordinate
    #     space in which to interpret data values, either 'data' (default) or
    #     'screen'. For the 'angle' parameter, this property is either 'deg' or
    #     'rad'.
    #
    # Example:
    #   type: 'rects'
    #   x:
    #     field: 'var1'
    #     units: 'data'
    #   y:
    #     field: 'var2'
    #     default: 10
    #     units: screen
    #
    # However, a shorthand can be used if only the field name needs to be
    # specified, or a constant default numerical value is to be used.  
    #
    # Example:
    #   type: 'rects'
    #   width: 'var3' # shorthand for field:'var3'
    #   height: 8     # shorthand for default:8, units:'data'
    #
    # If a numerical default value is specified, it can still be overridden on
    # a per-datapoint basis since the GlyphRenderer::display_defaults specify
    # default field names for each of these properties.  In the example above,
    # if a datapoint had an additional field named 'height', which is the default
    # field name for the height parameter, then it would override the constant
    # value of 8.
    #
    # For colors and other properties which can accept string values, there is
    # potential ambiguity in the shorthand form: 
    #   type: 'rects'
    #   color: 'red'
    #
    # Does this mean that the default value of `color` should be `'red'`, or
    # that the field named `'red'` should be used to determine the color of
    # each datapoint?  To resolve this, for colors, the shorthand is 
    # interpreted to mean the former, because this is such a common case.  To
    # specify the fieldname for color-related properties, use the long form:
    #
    #   type: 'rects'
    #   color:
    #     field: 'colorfieldname'
    # 
    # ## Other parameters
    # * color: field name for fill color
    # * colorval: default color value if no field is specified or if the specified
    #     field does not exist on a datapoint
    # * bordercolor: field name for the border to draw around each rect
    # * bcolorval: default border color value
    # * alpha: field name for alpha value
    # * alphaval: default alpha value (0..1)

    # Gather up the defaults so we can pass them in to @get_datapt_attr
    default_color = @mget('color')
    default_bordercolor = @mget('bordercolor')
    default_alpha = @mget('alpha')

    # Create custom getter functions for each parameter
    # TODO: Replace this and @_build_getters with a Glyph class
    if glyphspec.x?   # use centers, widths, heights
      params = ['x','y','width','height']
    else if glyphspec.left?   # use bounds
      params = ['left','right','bottom','top']
    
    params.push.apply(params, ["angle","color","bordercolor","alpha"])
    getters = @_build_getters(params, glyph)

    @plot_view.ctx.save()
    for datapoint in data
      if glyphspec.x?
        # Glyph is specifying center and extent, so compute screen-space
        # top/bottom/left/right based on these.
        
        [x, x_units] = getters['x'](datapoint)
        [width, width_units] = getters['width'](datapoint)
        [left, right, h_units] = @_span2bounds(x, x_units, width, width_units, @xmapper)
        if h_units == 'data'
          left = @xmapper.map_screen(left)
          right = @xmapper.map_screen(right)
        
        [y, y_units] = getters['y'](datapoint)
        [height, height_units] = getters['height'](datapoint)
        [bottom, top, v_units] = @_span2bounds(y, y_units, height, height_units, @ymapper)
        if v_units == 'data'
          bottom = @ymapper.map_screen(bottom)
          top = @ymapper.map_screen(top)

      else
        # Glyph is specifying bounds, so transform to screen space (if
        # necessary)
        [left, units] = getters['left'](datapoint)
        if units == 'data'
          left = @xmapper.map_screen(left)
        [right, units] = getters['right'](datapoint)
        if units == 'data'
          right = @xmapper.map_screen(right)
        [bottom, units] = getters['bottom'](datapoint)
        if units == 'data'
          bottom = @ymapper.map_screen(bottom)
        [top, units] = getters['top'](datapoint)
        if units == 'data'
          top = @ymapper.map_screen(top)

      # At this point, we have the box boundaries (left, right, bottom, top)
      # in screen space coordinates, and should be ready to draw.
      
      # In the following, we need to grab the first element of the returned
      # valued b/c getter functions always return (val, units) and we don't
      # care about units for color.
      fillcolor = getters['color'](datapoint)[0]
      strokecolor = getters['bordercolor'](datapoint)[0]
      alpha = getters['alpha'](datapoint)[0]
      ctx = @plot_view.ctx
      ctx.globalAlpha = alpha
      if fillcolor != "none"
        ctx.fillStyle = fillcolor
        ctx.fillRect(left, bottom, right-left, top-bottom)
      if strokecolor != "none"
        ctx.strokeStyle = strokecolor
        ctx.rect(left, bottom, right-left, top-bottom)
      # End per-datapoint loop

    # Done with all drawing, restore the graphics state
    @plot_view.ctx.restore()
    return      # render_rects()

  _span2bounds : (center, center_units, span, span_units, mapper) ->
    # Given a center value and a span value of potentially different
    # spaces, returns an tuple (min, max, units) normalizing them
    # into the space space ('data' or 'screen'), via the given mapper.
    # NB: The mapper must be able to map from screen to data space.
    # TODO: This function should probably be moved onto the Mappers.
    halfspan = span / 2
    if center_units == 'data' and span_units == 'data'
      return [center-halfspan, center+halfspan, 'data']
    else if center_units == 'data' and span_units == 'screen'
      center_s = mapper.map_screen(center)
      return [center_s-halfspan, center_s+halfspan, 'screen']
    else if center_units == 'screen' and span_units == 'data'
      center_d = mapper.map_data(center)
      return [center_d-halfspan, centerd+halfspan, 'data']
    else if center_units == 'screen' and span_units == 'screen'
      return [center-halfspan, center+halfspan, 'screen']

  _build_getters : (params, glyph) ->
    # Builds a dictionary of getter functions which performs attribute
    # value lookup (and resolves default values) at each datapoint.
    #
    # TODO: This is really a design hack. It should be replaced with a
    # MetaGlyph metaclass which builds in the logic of delegation into its
    # attribute lookup facility.  Then, each type of glyph renderer would
    # create a Glyph class, passing in the list of attribute names. In the
    # _render_GLYPHNAME() function, a Glyph would be instantiated for each
    # datapoint, with the ctor taking arguments such as 'this' (which for
    # now serves as a stylesheet).  Then the drawing logic would be very
    # concise, and the concerns of delegated attribute lookup would be
    # separated cleanly from the concern of drawing.
    #
    # To handle the concept of 'units', which only exists for some kinds
    # of parameters, a separate .units() function could be used.
    #
    # ### Parameters
    # * params: a list of strings, e.g. ['x', 'y' ,'size', 'color'], which
    #     represent the attributes that we are building setters for. These
    #     names are significant; they should have default values in
    #     GlyphRenderer::display_defaults, and these names will be used
    #     verbatim as the default field names to look for in each datapoint.
    getters = {}
    for paramname in params
      units = 'data'
      if paramname of glyph
        if _.isString(glyph[paramname])
          units = 'data'
          default_value = @mget(paramname)
          attrname = glyph[paramname]
        else if _.isObject(glyph[paramname])
          # 'units' is probably not relevant for non-spatial 
          { default: default_value, field: attrname, units: units } = glyph[paramname]
        else
          units = 'data'
          default_value = glyph[paramname]
          # The default field name to look for on each datapoint is just the
          # parameter name, e.g. we look for 'height' or 'bottom' on each
          # datapoint.
          attrname = paramname
      else
        # If this parameter is absent from the glyph altogether
        units = 'data'
        attrname = paramname
        default_value = @mget(paramname)

      getters[paramname] = do (attrname, default_value, units) ->
        # Bake these loop variables into the closure
        (datapoint) ->
          # Returns (value, units) for the actual value for a given
          # parameter at a datapoint.
          if attrname of datapoint
            return [datapoint[attrname], units]
          else
            return [default_value, units]
    return getters


class ScatterRendererView extends XYRendererView
  #FIXME: render_canvas
  render : ->
    "use strict";
    super()
    if @model.get_obj('data_source').get('selecting') == true
        #skip data sources which are not selecting'
        @render_end()
        return null

    data = @model.get_obj('data_source').get('data')
    @calc_buffer(data)
    @plot_view.ctx.beginPath()
    @plot_view.ctx.fillStyle = @mget('foreground_color')
    @plot_view.ctx.strokeStyle = @mget('foreground_color')
    color_field = @mget('color_field')
    ctx = @plot_view.ctx
    if color_field
      color_mapper = @model.get_obj('color_mapper')
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

class ScatterSelectionOverlayView extends PlotWidget
  bind_events : () ->
    'pass'
  bind_bokeh_events  : () ->
    #add logic so that if the number of renderers change, the new renderers are bound
    for renderer in @mget_obj('renderers')
      safebind(@, renderer, 'change', @request_render)
      safebind(@, renderer.get_obj('xdata_range'), 'change', @request_render)
      safebind(@, renderer.get_obj('xdata_range'), 'change', @request_render)
      safebind(@, renderer.get_obj('data_source'), 'change', @request_render)

  #FIXME integrate into ScatterRenderer
  render : () ->
    window.overlay_render += 1
    super()
    for renderer in @mget_obj('renderers')
      rendererview = @plot_view.renderers[renderer.id]
      selected = {}
      if renderer.get_obj('data_source').get('selecting') == false
        #skip data sources which are not selecting'
        continue
      sel_idxs = renderer.get_obj('data_source').get('selected')
      ds = renderer.get_obj('data_source')
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
        color_mapper = rvm.get_obj('color_mapper')
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
Bokeh.GlyphRendererView = GlyphRendererView
Bokeh.GridPlotContainerView = GridPlotContainerView
Bokeh.ScatterSelectionOverlayView = ScatterSelectionOverlayView
Bokeh.LinearAxisView = LinearAxisView
Bokeh.LinearDateAxisView = LinearDateAxisView
