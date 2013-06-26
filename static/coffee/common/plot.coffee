base = require('../base')
Collections = base.Collections
HasParent = base.HasParent
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView

LinearMapper = require('../mappers/1d/linear_mapper').LinearMapper
GridMapper = require('../mappers/2d/grid_mapper').GridMapper

ViewState = require('./view_state').ViewState

ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager


LEVELS = ['image', 'underlay', 'glyph', 'overlay', 'annotation', 'tool']

class PlotView extends ContinuumView

  view_options: () ->
    _.extend({plot_model: @model, plot_view: @}, @options)

  events:
    "mousemove .bokeh_canvas_wrapper": "_mousemove"
    "mousedown .bokeh_canvas_wrapper": "_mousedown"

  _mousedown: (e) ->
    for f in @mousedownCallbacks
      f(e, e.layerX, e.layerY)

  _mousemove: (e) ->
    for f in @moveCallbacks
      f(e, e.layerX, e.layerY)

  pause : () ->
    @is_paused = true

  unpause : () ->
    @is_paused = false
    @request_render()

  request_render : () ->
    if not @is_paused
      @throttled_render()
    return

  request_render_canvas : () ->
    if not @is_paused
      @throttled_render_canvas()
    return

  initialize: (options) ->
    @throttled_render = _.throttle(@render, 50)
    @throttled_render_canvas = _.throttle(@render_canvas, 30)

    super(_.defaults(options, @default_options))

    @view_state = new ViewState({
      canvas_width:  options.canvas_width  ? @mget('canvas_width')
      canvas_height: options.canvas_height ? @mget('canvas_height')
      x_offset:      options.x_offset      ? @mget('x_offset')
      y_offset:      options.y_offset      ? @mget('y_offset')
      outer_width:   options.outer_width   ? @mget('outer_width')
      outer_height:  options.outer_height  ? @mget('outer_height')
      border_top:    (options.border_top    ? @mget('border_top'))    ? @mget('border')
      border_bottom: (options.border_bottom ? @mget('border_bottom')) ? @mget('border')
      border_left:   (options.border_left   ? @mget('border_left'))   ? @mget('border')
      border_right:  (options.border_right  ? @mget('border_right'))  ? @mget('border')
    })

    @x_range = options.x_range ? @mget_obj('x_range')
    @y_range = options.y_range ? @mget_obj('y_range')

    @xmapper = new LinearMapper({
      source_range: @x_range
      target_range: @view_state.get('inner_range_horizontal')
    })

    @ymapper = new LinearMapper({
      source_range: @y_range
      target_range: @view_state.get('inner_range_vertical')
    })

    @mapper = new GridMapper({
      domain_mapper: @xmapper
      codomain_mapper: @ymapper
    })

    @renderers = {}
    @tools = {}

    @eventSink = _.extend({}, Backbone.Events)
    @moveCallbacks = []
    @mousedownCallbacks = []
    @keydownCallbacks = []
    @render_init()
    @render_canvas(false)
    @build_levels()
    @request_render()
    return this

  map_to_screen : (x, x_units, y, y_units, units) ->
    if x_units == 'screen'
      sx = x[..]
      sy = y[..]
    else
      [sx, sy] = @mapper.v_map_to_target(x, y)

    sx = @view_state.v_sx_to_device(sx)
    sy = @view_state.v_sy_to_device(sy)

    return [sx, sy]

  map_from_screen : (sx, sy, units) ->
    sx = @view_state.v_device_sx(sx[..])
    sy = @view_state.v_device_sx(sy[..])

    if units == 'screen'
      x = sx
      y = sy
    else
      [x, y] = @mapper.v_map_from_target(sx, sy)  # TODO: in-place?

    return [x, y]

  build_tools: () ->
    build_views(@tools, @mget_obj('tools'), @view_options())
    return this

  bind_tools: () ->
    for toolspec in @mget('tools')
      @tools[toolspec.id].bind_events(this)
    return this

  build_views: ()->
    build_views(@renderers, @mget_obj('renderers'), @view_options())
    return this

  build_levels: () ->
    @build_views()
    @build_tools()
    @levels = {}
    for level in LEVELS
      @levels[level] = {}

    for k,v of @renderers
      level = v.mget('level')
      @levels[level][k] = v

    for k,v of @tools
      level = v.mget('level')
      @levels[level][k] = v
    @atm = new ActiveToolManager(@eventSink)
    @atm.bind_bokeh_events()
    @bind_bokeh_events()
    for toolview in _.values(@tools)
      toolview.bind_bokeh_events()
    for view in _.values(@renderers)
      view.bind_bokeh_events()
    return this

  bind_bokeh_events: () ->
    safebind(this, @view_state, 'change', @request_render_canvas)
    safebind(this, @x_range, 'change', @request_render)
    safebind(this, @y_range, 'change', @request_render)
    safebind(this, @model, 'change:renderers', @build_levels)
    safebind(this, @model, 'change:tool', @build_levels)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'destroy', () => @remove())

  render_init: () ->
    # TODO use template
    @$el.append($("""
      <div class='button_bar'/>
      <div class='bokeh_canvas_wrapper'>
        <canvas class='bokeh_canvas'></canvas>
      </div>
      """))
    @button_bar = @$el.find('.button_bar')
    @canvas_wrapper = @$el.find('.bokeh_canvas_wrapper')
    @canvas = @$el.find('canvas.bokeh_canvas')

  render_canvas: (full_render = true) ->
    oh = @view_state.get('outer_height')
    ow = @view_state.get('outer_width')

    @button_bar.attr('style', "width:#{ow}px;")
    @canvas_wrapper.attr('style', "width:#{ow}px; height:#{oh}px")
    @canvas.attr('width', ow).attr('height', oh)
    @$el.attr("width", ow).attr('height', oh)

    @ctx = @canvas[0].getContext('2d')

    if full_render
      @render();

    @render_end()

  save_png: () ->
    @render()
    data_uri = @canvas[0].toDataURL()
    @model.set('png', @canvas[0].toDataURL())
    base.Collections.bulksave([@model])


  render: (force) ->
    super()
    @ctx.fillStyle = @mget('border_fill')
    @ctx.fillRect(0,0,  @view_state.get('canvas_width'), @view_state.get('canvas_height'))
    @ctx.fillStyle = @mget('background_fill')
    @ctx.fillRect(
      @view_state.get('border_left'), @view_state.get('border_top'),
      @view_state.get('inner_width'), @view_state.get('inner_height'),
    )

    @ctx.save()

    @ctx.beginPath()
    @ctx.rect(
      @view_state.get('border_left'), @view_state.get('border_top'),
      @view_state.get('inner_width'), @view_state.get('inner_height'),
    )
    @ctx.clip()
    @ctx.beginPath()

    for level in ['image', 'underlay', 'glyph']
      renderers = @levels[level]
      for k, v of renderers
        v.render()

    @ctx.restore()

    for level in ['overlay', 'annotation', 'tool']
      renderers = @levels[level]
      for k, v of renderers
        v.render()
class PNGView extends ContinuumView

  view_options: () ->
    _.extend({plot_model: @model, plot_view: @}, @options)

  request_render : () ->
    if not @is_paused
      @throttled_render()
    return

  initialize: (options) ->
    @throttled_render = _.throttle(@render, 50)
    @throttled_render_canvas = _.throttle(@render_canvas, 30)
    @thumb_x = options.thumb_x or 40
    @thumb_y = options.thumb_y or 40
    super(_.defaults(options, @default_options))
    @request_render()
    return this


  render: (force) ->
    super()
    png = @model.get('png')
    @$el.append($("<img  width='#{@thumb_x}'  height='#{@thumb_y}'  src='#{png}'/>"))



class Plot extends HasParent
  type: 'Plot'
  #default_view: PNGView
  default_view: PlotView

  add_renderers: (new_renderers) ->
    renderers = @get('renderers')
    renderers = renderers.concat(new_renderers)
    @set('renderers', renderers)

  parent_properties: [
    'background_fill',
    'border_fill',
    'canvas_width',
    'canvas_height',
    'outer_width',
    'outer_height',
    'border',
    'border_top',
    'border_bottom'
    'border_left'
    'border_right'
  ]

Plot::defaults = _.clone(Plot::defaults)
_.extend(Plot::defaults , {
  'data_sources': {},
  'renderers': [],
  'tools': [],
  'title': 'Plot'
})

Plot::display_defaults = _.clone(Plot::display_defaults)
_.extend(Plot::display_defaults
  ,
    background_fill: "#fff",
    border_fill: "#eee",
    border: 40,
    x_offset: 0,
    y_offset: 0,
    canvas_width: 300,
    canvas_height: 300,
    outer_width: 300,
    outer_height: 300
)

class Plots extends Backbone.Collection
   model: Plot


exports.Plot = Plot
exports.PlotView = PlotView
exports.PNGView = PNGView
exports.plots = new Plots
