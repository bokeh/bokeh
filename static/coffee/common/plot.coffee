base = require("../base")
HasParent = base.HasParent
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView

ActiveToolManager = require("../tools/activetoolmanager").ActiveToolManager

class PlotView extends ContinuumView
  default_options: {scale:1.0}

  view_options: () ->
    _.extend({plot_model: @model, plot_view: @}, @options)

  build_renderers: () ->
    build_views(@renderers, @mget_obj('renderers'), @view_options())

  build_axes: () ->
    build_views(@axes, @mget_obj('axes'), @view_options())

  build_tools: () ->
    #build_views(@model, @tools, @mget('tools'), @model_specs())
    build_views(@tools, @mget_obj('tools'), @view_options())

  build_overlays: () ->
    #add ids of renderer views into the overlay spec
    build_views(@overlays, @mget_obj('overlays'), @view_options())

  bind_overlays: () ->
    for overlayspec in @mget('overlays')
      @overlays[overlayspec.id].bind_events(this)

  bind_tools: () ->
    for toolspec in @mget('tools')
      @tools[toolspec.id].bind_events(this)

  tagName: 'div'

  events:
    "mousemove .main_can_wrapper": "_mousemove"
    "mousedown .main_can_wrapper": "_mousedown"

  _mousedown: (e) ->
    for f in @mousedownCallbacks
      f(e, e.layerX, e.layerY)

  _mousemove: (e) ->
    for f in @moveCallbacks
      f(e, e.layerX, e.layerY)


  initialize: (options) ->
    @throttled = _.throttle(@render_deferred_components, 50)
    super(_.defaults(options, @default_options))
    height = if options.height then options.height else @mget('height')
    width = if options.width then options.width else @mget('width')
    offset = if options.offset then options.offset else @mget('offset')
    if options.border_space
      border_space = options.border_space
    else
      border_space = @mget('border_space')
    @viewstate = new PlotViewState(
      height: height
      width: width
      offset: offset
      border_space: border_space
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
    @throttled()
    return this

  render_init: () ->
    #FIXME template
    @$el.append($("""
      <div class='button_bar'/>
      <div class='all_can_wrapper'>

        <div class='main_can_wrapper can_wrapper'>
          <div class='_shader' />
          <canvas class='main_can'></canvas>
        </div>
      </div>
      """))
    @$el.addClass("plot_wrap")
    @canvas = @$el.find('canvas.main_can')
    @main_can_wrapper = @$el.find('.main_can_wrapper')

  build_subviews: ()->
    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()
    @bind_tools()
    @bind_overlays()


  bind_bokeh_events: () ->
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

  render: () ->
    height = @viewstate.get('height')
    width = @viewstate.get('width')
    border_space = @viewstate.get('border_space')
    outerheight = @viewstate.get('outerheight')
    outerwidth = @viewstate.get('outerwidth')
    super()
    @$el.attr("width", outerwidth)
      .attr('height', outerheight)
    bord = border_space
    w = width
    h = height

    o_w = outerwidth
    o_h = outerheight
    @main_can_wrapper.attr('style', "left:#{bord}px; height:#{h}px; width:#{w}px")


    @$el.attr("style", "height:#{o_h}px; width:#{o_w}px")
    wh = (el, w, h) ->
      $(el).attr('width', w)
      $(el).attr('height',h)
    wh(@canvas, w, h)

    @ctx = @canvas[0].getContext('2d')
    @render_end()

  render_deferred_components: (force) ->
    #console.log("plotview render deferred components", @constructor, new Date() - 1)
    all_views = _.flatten(_.map([@tools, @renderers, @overlays], _.values))
    @ctx.clearRect(0,0,  @viewstate.get('width'), @viewstate.get('height'))
    for v in all_views
      v.render()


class Plot extends HasParent
  type: 'Plot'
  default_view: PlotView
  parent_properties: ['background_color', 'foreground_color',
    'width', 'height', 'border_space', 'unselected_color']
Plot::defaults = _.clone(Plot::defaults)
_.extend(Plot::defaults , {
  'data_sources': {},
  'renderers': [],
  'axes': [],
  'legends': [],
  'tools': [],
  'overlays': [],
  'usedialog': false,
  'title': 'Plot'
})
Plot::display_defaults = _.clone(Plot::display_defaults)
_.extend(Plot::display_defaults
  ,
    background_color: "#eee"
    foreground_color: "#333"
    unselected_color: "#ccc"
)

class Plots extends Backbone.Collection
   model: Plot


class PlotViewState extends HasParent
  # This Viewstate has height/width/border_space information
  # Primarily used by PlotViews
  initialize: (attrs, options)->
    super(attrs, options)
    @register_property('outerwidth',
        () -> @get('width') + 2 * @get('border_space')
      , false)
    @add_dependencies('outerwidth', this, ['width', 'border_space'])
    @register_property('outerheight',
       () -> @get('height') + 2 * @get('border_space')
      , false)
    @add_dependencies('outerheight', this, ['height', 'border_space'])
  #transform our coordinate space to the underlying device (svg)
  xpos: (x) ->
    return x
  ypos: (y) ->
    return @get('height') - y

  #vectorized versions of xpos/ypos, operates in place
  v_xpos: (xx) ->
    return xx[..]
  v_ypos: (yy) ->
    height = @get('height')
    res = new Array(yy.length)
    for y, idx in yy
       res[idx] = height - y
    return res

  #transform underlying device (svg) to our coordinate space
  rxpos: (x) ->
    return x

  rypos: (y) ->
    return @get('height') - y

  #compute a childs position in the underlying device
  position_child_x: (childsize, offset) ->
    return  @xpos(offset)
  position_child_y: (childsize, offset) ->
    return @ypos(offset) - childsize

  defaults:
    parent: null

  display_defaults:
    width: 200
    height: 200
    position: 0
    offset: [0,0]
    border_space: 30



exports.Plot = Plot
exports.PlotView = PlotView
exports.PlotViewState = PlotViewState
exports.plots = new Plots
