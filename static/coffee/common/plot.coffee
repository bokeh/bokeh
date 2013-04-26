base = require('../base')
Collections = base.Collections
HasParent = base.HasParent
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView

LinearMapper = require('../mappers/1d/linear_mapper').LinearMapper
GridMapper = require('../mappers/2d/grid_mapper').GridMapper

ViewState = require('./view_state').ViewState

ActiveToolManager = require("../tools/activetoolmanager").ActiveToolManager



class PlotView extends ContinuumView

  view_options: () ->
    _.extend({plot_model: @model, plot_view: @}, @options)

  build_tools: () ->
    build_views(@tools, @mget_obj('tools'), @view_options())

  bind_tools: () ->
    for toolspec in @mget('tools')
      @tools[toolspec.id].bind_events(this)

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
      @throttled()
    return

  initialize: (options) ->
    @throttled = _.throttle(@render_deferred_components, 50)

    super(_.defaults(options, @default_options))

    @view_state = new ViewState({
      canvas_width:  options.canvas_width  ? @mget('canvas_width')
      canvas_height: options.canvas_height ? @mget('canvas_height')
      x_offset:      options.x_offset      ? @mget('x_offset')
      y_offset:      options.y_offset      ? @mget('y_offset')
      outer_width:   options.outer_width   ? @mget('outer_width')
      outer_height:  options.outer_height  ? @mget('outer_height')
      border_top:    options.border_top    ? @mget('border_top')    ? @mget('border')
      border_bottom: options.border_bottom ? @mget('border_bottom') ? @mget('border')
      border_left:   options.border_left   ? @mget('border_left')   ? @mget('border')
      border_right:  options.border_right  ? @mget('border_right')  ? @mget('border')
    })

    @x_range = options.x_range ? @mget('x_range')
    @y_range = options.y_range ? @mget('y_range')

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
    atm = new ActiveToolManager(@eventSink)
    @moveCallbacks = []
    @mousedownCallbacks = []
    @keydownCallbacks = []
    @render_init()
    @render()
    @build_views()
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

  render_init: () ->
    #FIXME template
    @$el.append($("""
      <div class='button_bar'/>
      <div class='bokeh_canvas_wrapper'>
        <canvas class='bokeh_canvas'></canvas>
      </div>
      """))
    @canvas_wrapper = @$el.find('.bokeh_canvas_wrapper')
    @canvas = @$el.find('canvas.bokeh_canvas')

  build_views: ()->
    build_views(@renderers, @mget_obj('renderers'), @view_options())

    @images = {}
    @underlays = {}
    @glyphs = {}
    @overlays = {}
    @annotations = {}
    for k,v of @renderers
      if v.mget('level') == 'image'
        @images[k] = v
      if v.mget('level') == 'underlay'
        @underlays[k] = v
      if v.mget('level') == 'glyph'
        @glyphs[k] = v
      if v.mget('level') == 'overlay'
        @overlays[k] = v
      if v.mget('level') == 'annotation'
        @annotations[k] = v

    @build_tools()
    @bind_tools()

  bind_bokeh_events: () ->
    safebind(this, @view_state, 'change', @render)
    safebind(this, @x_range, 'change', @request_render)
    safebind(this, @y_range, 'change', @request_render)
    safebind(this, @model, 'change:renderers', @build_views)
    safebind(this, @model, 'change:tool', @build_tools)
    safebind(this, @model, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())

  # FIXME document throughly when render is called vs render_deferred
  # should we have a "render_init" "render" and a
  # "render_canvas" function add_dom is called at instatiation.
  # "render" is called for plot resizing.  render_canvas is called
  # when changes to the canvas are desired.  A ScatterRendererView
  # would only have a "render_canvas function

  render: () ->
    super()

    oh = @view_state.get('outer_height')
    ow = @view_state.get('outer_width')

    @canvas_wrapper.attr('style', "width:#{ow}px; height:#{oh}px")
    @canvas.attr('width', ow).attr('height', oh)
    @$el.attr("width", ow).attr('height', oh)

    @ctx = @canvas[0].getContext('2d')

    @render_end()

  render_deferred_components: (force) ->
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

    for k, v of @images
      v.render()
    for k, v of @underlays
      v.render()
    for k, v of @glyphs
      v.render()

    @ctx.restore()

    for k, v of @overlays
      v.render()
    for k, v of @annotations
      v.render()


class Plot extends HasParent
  type: 'Plot'
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
exports.plots = new Plots
