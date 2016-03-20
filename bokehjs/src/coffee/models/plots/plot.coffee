_ = require "underscore"
$ = require "jquery"
Backbone = require "backbone"

Canvas = require "../canvas/canvas"
CartesianFrame = require "../canvas/cartesian_frame"
LayoutBox = require "../canvas/layout_box"
Component = require "../component"
GlyphRenderer = require "../renderers/glyph_renderer"
Renderer = require "../renderers/renderer"

build_views = require "../../common/build_views"
ToolEvents = require "../../common/tool_events"
ToolManager = require "../../common/tool_manager"
UIEvents = require "../../common/ui_events"

BokehView = require "../../core/bokeh_view"
enums = require "../../core/enums"
{EQ, GE, Strength} = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"
{throttle} = require "../../core/util/throttle"

plot_template = require "./plot_template"

# Notes on WebGL support:
# Glyps can be rendered into the original 2D canvas, or in a (hidden)
# webgl canvas that we create below. In this way, the rest of bokehjs
# can keep working as it is, and we can incrementally update glyphs to
# make them use GL.
#
# When the author or user wants to, we try to create a webgl canvas,
# which is saved on the ctx object that gets passed around during drawing.
# The presence (and not-being-false) of the ctx.glcanvas attribute is the
# marker that we use throughout that determines whether we have gl support.

global_gl_canvas = null

get_size_for_available_space = (use_width, use_height, client_width, client_height, aspect_ratio, min_size) =>
    # client_width and height represent the available size

    if use_width
      new_width1 = Math.max(client_width, min_size)
      new_height1 = parseInt(new_width1 / aspect_ratio)
      if new_height1 < min_size
        new_height1 = min_size
        new_width1 = parseInt(new_height1 * aspect_ratio)
    if use_height
      new_height2 = Math.max(client_height, min_size)
      new_width2 = parseInt(new_height2 * aspect_ratio)
      if new_width2 < min_size
        new_width2 = min_size
        new_height2 = parseInt(new_width2 / aspect_ratio)

    if (not use_height) and (not use_width)
      return null  # remain same size
    else if use_height and use_width
      if new_width1 < new_width2
        return [new_width1, new_height1]
      else
        return [new_width2, new_height2]
    else if use_height
     return [new_width2, new_height2]
    else
      return [new_width1, new_height1]

# TODO (bev) PlotView should not be a RendererView
class PlotView extends Renderer.View
  template: plot_template

  state: { history: [], index: -1 }

  view_options: () ->
    _.extend({plot_model: @model, plot_view: @}, @options)

  pause: () ->
    @is_paused = true

  unpause: () ->
    @is_paused = false
    @request_render()

  request_render: () =>
    if not @is_paused
      @throttled_render()
    return

  remove: () =>
    super()
    # When this view is removed, also remove all of the tools.
    for id, tool_view of @tools
      tool_view.remove()

  initialize: (options) ->
    super(options)
    @pause()

    # compat, to be removed
    @frame = @mget('frame')
    @canvas = @mget('canvas')
    @canvas_view = new @canvas.default_view({'model': @canvas})
    @x_range = @frame.get('x_ranges')['default']
    @y_range = @frame.get('y_ranges')['default']
    @xmapper = @frame.get('x_mappers')['default']
    @ymapper = @frame.get('y_mappers')['default']

    @$el.html(@template())
    @$('.bk-plot-canvas-wrapper').append(@canvas_view.el)

    @_initial_state_info = {
      range: null                     # set later by set_initial_range()
      selection: {}                   # XXX: initial selection?
      dimensions: {
        width: @canvas.get("width")
        height: @canvas.get("height")
      }
    }

    # Formerly in initialize_layout
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @mget(side)
      for r in layout_renderers
        if r.get('location') ? 'auto' == 'auto'
          r.set('layout_location', side, { silent: true })
        else
          r.set('layout_location', r.get('location'), { silent: true })
        r.initialize_layout()
    @canvas_view.render(true)

    # If requested, try enabling webgl
    if @mget('webgl') or window.location.search.indexOf('webgl=1') > 0
      if window.location.search.indexOf('webgl=0') == -1
        @init_webgl()

    @throttled_render = throttle(@render, 15) # TODO (bev) configurable

    @renderers = {}
    @tools = {}

    @levels = {}
    for level in enums.RenderLevel
      @levels[level] = {}
    @build_levels()
    @bind_bokeh_events()

    @ui_event_bus = new UIEvents({
      tool_manager: @mget('tool_manager')
      hit_area: @canvas_view.$el
    })
    for id, tool_view of @tools
      @ui_event_bus.register_tool(tool_view)

    toolbar_location = @mget('toolbar_location')
    if toolbar_location?
      toolbar_selector = '.bk-plot-' + toolbar_location
      logger.debug("attaching toolbar to #{toolbar_selector} for plot #{@model.id}")
      @tm_view = new ToolManager.View({
        model: @mget('tool_manager')
        el: @$(toolbar_selector)
        location: toolbar_location
      })

    @update_dataranges()

    if @mget('responsive')
      throttled_resize = _.throttle(@resize, 100)
      $(window).on("resize", throttled_resize)
      # Just need to wait a small delay so container has a width
      _.delay(@resize, 10)

    @unpause()

    logger.debug("PlotView initialized")

    return this

  init_webgl: () ->

    # We use a global invisible canvas and gl context. By having a global context,
    # we avoid the limitation of max 16 contexts that most browsers have.
    glcanvas = global_gl_canvas
    if not glcanvas?
      global_gl_canvas = glcanvas = document.createElement('canvas')
      opts = {'premultipliedAlpha': true}  # premultipliedAlpha is true by default
      glcanvas.gl = glcanvas.getContext("webgl", opts) || glcanvas.getContext("experimental-webgl", opts)

    # If WebGL is available, we store a reference to the gl canvas on
    # the ctx object, because that's what gets passed everywhere.
    if glcanvas.gl?
      @canvas_view.ctx.glcanvas = glcanvas
    else
      logger.warn('WebGL is not supported, falling back to 2D canvas.')
      # Do not set @canvas_view.ctx.glcanvas

  update_dataranges: () ->
    # Update any DataRange1ds here
    bounds = {}
    for k, v of @renderers
      bds = v.glyph?.bounds?()
      if bds?
        bounds[k] = bds

    follow_enabled = false
    has_bounds = false
    for xr in _.values(@frame.get('x_ranges'))
      xr.update?(bounds, 0, @model.id)
      follow_enabled = true if xr.get('follow')?
      has_bounds = true if xr.get('bounds')?
    for yr in _.values(@frame.get('y_ranges'))
      yr.update?(bounds, 1, @model.id)
      follow_enabled = true if yr.get('follow')?
      has_bounds = true if yr.get('bounds')?

    if follow_enabled and has_bounds
      logger.warn('Follow enabled so bounds are unset.')
      for xr in _.values(@frame.get('x_ranges'))
        xr.set('bounds', null)
      for yr in _.values(@frame.get('y_ranges'))
        yr.set('bounds', null)

    @range_update_timestamp = Date.now()

  map_to_screen: (x, y, x_name='default', y_name='default') ->
    @frame.map_to_screen(x, y, @canvas, x_name, y_name)

  push_state: (type, info) ->
    prev_info = @state.history[@state.index]?.info or {}
    info = _.extend({}, @_initial_state_info, prev_info, info)

    @state.history.slice(0, @state.index + 1)
    @state.history.push({type: type, info: info})
    @state.index = @state.history.length - 1

    @trigger("state_changed")

  clear_state: () ->
    @state = {history: [], index: -1}
    @trigger("state_changed")

  can_undo: () ->
    @state.index >= 0

  can_redo: () ->
    @state.index < @state.history.length - 1

  undo: () ->
    if @can_undo()
      @state.index -= 1
      @_do_state_change(@state.index)
      @trigger("state_changed")

  redo: () ->
    if @can_redo()
      @state.index += 1
      @_do_state_change(@state.index)
      @trigger("state_changed")

  _do_state_change: (index) ->
    info = @state.history[index]?.info or @_initial_state_info

    if info.range?
      @update_range(info.range)

    if info.selection?
      @update_selection(info.selection)

    if info.dimensions?
      @update_dimensions(info.dimensions)

  update_dimensions: (dimensions) ->
    @canvas.set_dims([dimensions.width, dimensions.height])

  reset_dimensions: () ->
    @update_dimensions({width: @canvas.get('canvas_width'), height: @canvas.get('canvas_height')})

  get_selection: () ->
    selection = []
    for renderer in @mget('renderers')
      if renderer instanceof GlyphRenderer.Model
        selected = renderer.get('data_source').get("selected")
        selection[renderer.id] = selected
    selection

  update_selection: (selection) ->
    for renderer in @mget("renderers")
      if renderer not instanceof GlyphRenderer.Model
        continue
      ds = renderer.get('data_source')
      if selection?
        if renderer.id in selection
          ds.set("selected", selection[renderer.id])
      else
        ds.get('selection_manager').clear()

  reset_selection: () ->
    @update_selection(null)

  _update_single_range: (rng, range_info, is_panning) ->
    # Is this a reversed range?
    reversed = if rng.get('start') > rng.get('end') then true else false

    # Prevent range from going outside limits
    # Also ensure that range keeps the same delta when panning

    if rng.get('bounds')?
      min = rng.get('bounds')[0]
      max = rng.get('bounds')[1]

      if reversed
        if min?
          if min >= range_info['end']
            range_info['end'] = min
            if is_panning?
              range_info['start'] = rng.get('start')
        if max?
          if max <= range_info['start']
            range_info['start'] = max
            if is_panning?
              range_info['end'] = rng.get('end')
      else
        if min?
          if min >= range_info['start']
            range_info['start'] = min
            if is_panning?
              range_info['end'] = rng.get('end')
        if max?
          if max <= range_info['end']
            range_info['end'] = max
            if is_panning?
              range_info['start'] = rng.get('start')

    if rng.get('start') != range_info['start'] or rng.get('end') != range_info['end']
      rng.have_updated_interactively = true
      rng.set(range_info)
      rng.get('callback')?.execute(rng)

  update_range: (range_info, is_panning) ->
    @pause
    if not range_info?
      for name, rng of @frame.get('x_ranges')
        rng.reset()
      for name, rng of @frame.get('y_ranges')
        rng.reset()
      @update_dataranges()
    else
      for name, rng of @frame.get('x_ranges')
        @_update_single_range(rng, range_info.xrs[name], is_panning)
      for name, rng of @frame.get('y_ranges')
        @_update_single_range(rng, range_info.yrs[name], is_panning)
    @unpause()

  reset_range: () ->
    @update_range(null)

  build_levels: () ->
    # should only bind events on NEW views and tools
    old_renderers = _.keys(@renderers)
    views = build_views(@renderers, @mget('renderers'), @view_options())
    renderers_to_remove = _.difference(old_renderers,
                                       _.pluck(@mget('renderers'), 'id'))
    for id_ in renderers_to_remove
      delete @levels.glyph[id_]
    tools = build_views(@tools, @mget('tools'), @view_options())
    for v in views
      level = v.mget('level')
      @levels[level][v.model.id] = v
      v.bind_bokeh_events()
    for t in tools
      level = t.mget('level')
      @levels[level][t.model.id] = t
      t.bind_bokeh_events()
    return this

  bind_bokeh_events: () ->
    for name, rng of @frame.get('x_ranges')
      @listenTo(rng, 'change', @request_render)
    for name, rng of @frame.get('y_ranges')
      @listenTo(rng, 'change', @request_render)
    @listenTo(@model, 'change:renderers', @build_levels)
    @listenTo(@model, 'change:tool', @build_levels)
    @listenTo(@model, 'change', @request_render)
    @listenTo(@model, 'destroy', () => @remove())
    @listenTo(@model.document.solver(), 'layout_update', @request_render)

  set_initial_range : () ->
    # check for good values for ranges before setting initial range
    good_vals = true
    xrs = {}
    for name, rng of @frame.get('x_ranges')
      if (not rng.get('start')? or not rng.get('end')? or
          _.isNaN(rng.get('start') + rng.get('end')))
        good_vals = false
        break
      xrs[name] = { start: rng.get('start'), end: rng.get('end') }
    if good_vals
      yrs = {}
      for name, rng of @frame.get('y_ranges')
        if (not rng.get('start')? or not rng.get('end')? or
            _.isNaN(rng.get('start') + rng.get('end')))
          good_vals = false
          break
        yrs[name] = { start: rng.get('start'), end: rng.get('end') }
    if good_vals
      @_initial_state_info.range = @initial_range_info = {
        xrs: xrs
        yrs: yrs
      }
      logger.debug("initial ranges set")
    else
      logger.warn('could not set initial ranges')

  render: (force_canvas=false) ->
    logger.trace("Plot.render(force_canvas=#{force_canvas})")

    if not @model.document?
      return

    if Date.now() - @interactive_timestamp < @mget('lod_interval')
      @interactive = true
      lod_timeout = @mget('lod_timeout')
      setTimeout(() =>
          if @interactive and (Date.now() - @interactive_timestamp) > lod_timeout
            @interactive = false
          @request_render()
        , lod_timeout)
    else
      @interactive = false

    width = @mget("plot_width")
    height = @mget("plot_height")

    if (@canvas.get("canvas_width") != width or
        @canvas.get("canvas_height") != height)
      @canvas.set_dims([width, height], trigger=false)

    @canvas_view.render(force_canvas)

    if @tm_view?
      @tm_view.render()

    for k, v of @renderers
      if not @range_update_timestamp? or v.set_data_timestamp > @range_update_timestamp
        @update_dataranges()
        break

    @update_constraints()

    ctx = @canvas_view.ctx
    frame_box = [
      @canvas.vx_to_sx(@frame.get('left')),
      @canvas.vy_to_sy(@frame.get('top')),
      @frame.get('width'),
      @frame.get('height'),
    ]
    @_map_hook(ctx, frame_box)
    @_paint_empty(ctx, frame_box)

    if ctx.glcanvas
      # Sync canvas size
      ctx.glcanvas.width = @canvas_view.canvas[0].width
      ctx.glcanvas.height = @canvas_view.canvas[0].height
      # Prepare GL for drawing
      gl = ctx.glcanvas.gl
      gl.viewport(0, 0, ctx.glcanvas.width, ctx.glcanvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)
      # Clipping
      gl.enable(gl.SCISSOR_TEST)
      flipped_top = ctx.glcanvas.height - (frame_box[1] + frame_box[3])
      gl.scissor(frame_box[0], flipped_top, frame_box[2], frame_box[3])
      # Setup blending
      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # premultipliedAlpha == true
      #gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # Without premultipliedAlpha == false

    if @visuals.outline_line.doit
      @visuals.outline_line.set_value(ctx)
      ctx.strokeRect.apply(ctx, frame_box)

    @_render_levels(ctx, ['image', 'underlay', 'glyph', 'annotation'], frame_box)

    if ctx.glcanvas
      # Blit gl canvas into the 2D canvas. We set up offsets so the pixel
      # mapping is one-on-one and we do not get any blurring due to
      # interpolation. In theory, we could disable the image interpolation,
      # and we can on Chrome, but then the result looks ugly on Firefox. Since
      # the image *does* look sharp, this might be a bug in Firefox'
      # interpolation-less image rendering.
      # This is how we would disable image interpolation (keep as a reference)
      #for prefix in ['image', 'mozImage', 'webkitImage','msImage']
      #   ctx[prefix + 'SmoothingEnabled'] = window.SmoothingEnabled
      #ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      src_offset = 0.5
      dst_offset = 0.0
      ctx.drawImage(ctx.glcanvas, src_offset, src_offset, ctx.glcanvas.width, ctx.glcanvas.height,
                                  dst_offset, dst_offset, ctx.glcanvas.width, ctx.glcanvas.height)
      logger.debug('drawing with WebGL')

    @_render_levels(ctx, ['overlay', 'tool'])

    if not @initial_range_info?
      @set_initial_range()

  update_constraints: () =>
    s = @model.document.solver()
    # Note: -1 to effectively dilate the canvas by 1px
    s.suggest_value(@frame._width, @canvas.get('width') - 1)
    s.suggest_value(@frame._height, @canvas.get('height') - 1)
    for i, renderer_view of @renderers
      if renderer_view.update_constraints?
        renderer_view.update_constraints()

  resize: () =>
    @resize_width_height(true, false)

  resize_width_height: (use_width, use_height, maintain_ar=true) =>
    # Resize plot based on available width and/or height

    # the solver falls over if we try and resize too small.
    # min_size is currently set in defaults to 120, we can make this
    # user-configurable in the future, as it may not be the right number
    # if people set a large border on their plots, for example.

    # We need the parent node, because the el node itself collapses to zero
    # height. It might not be available though, if the initial resize
    # happened before the plot was added to the DOM. If that happens, we
    # try again in increasingly larger intervals (the first try should just
    # work, but lets play it safe).
    @_re_resized = @_re_resized or 0
    if not @.el.parentNode and @_re_resized < 14  # 2**14 ~ 16s
      setTimeout( (=> this.resize_width_height(use_width, use_height, maintain_ar)), 2**@_re_resized)
      @_re_resized += 1
      return

    avail_width = @.el.clientWidth
    avail_height = @.el.parentNode.clientHeight - 50  # -50 for x ticks
    min_size = @mget('min_size')

    if maintain_ar is false
      # Just change width and/or height; aspect ratio will change
      if use_width and use_height
        @canvas.set_dims([Math.max(min_size, avail_width), Math.max(min_size, avail_height)])
      else if use_width
        @canvas.set_dims([Math.max(min_size, avail_width), @canvas.get('height')])
      else if use_height
        @canvas.set_dims([@canvas.get('width'), Math.max(min_size, avail_height)])
    else
      # Find best size to fill space while maintaining aspect ratio
      ar = @canvas.get('width') / @canvas.get('height')
      w_h = get_size_for_available_space(use_width, use_height, avail_width, avail_height, ar, min_size)
      if w_h?
        @canvas.set_dims(w_h)

  _render_levels: (ctx, levels, clip_region) ->
    ctx.save()

    if clip_region?
      ctx.beginPath()
      ctx.rect.apply(ctx, clip_region)
      ctx.clip()
      ctx.beginPath()

    indices = {}
    for renderer, i in @mget("renderers")
      indices[renderer.id] = i

    sortKey = (renderer_view) -> indices[renderer_view.model.id]

    for level in levels
      renderer_views = _.sortBy(_.values(@levels[level]), sortKey)

      for renderer_view in renderer_views
        renderer_view.render()

    ctx.restore()

  _map_hook: (ctx, frame_box) ->

  _paint_empty: (ctx, frame_box) ->
    @visuals.border_fill.set_value(ctx)
    ctx.fillRect(0, 0,  @canvas_view.mget('width'), @canvas_view.mget('height'))
    ctx.clearRect(frame_box...)

    @visuals.background_fill.set_value(ctx)
    ctx.fillRect(frame_box...)

class Plot extends Component.Model
  default_view: PlotView
  type: 'Plot'

  initialize: (attrs, options) ->
    super(attrs, options)

    for xr in _.values(@get('extra_x_ranges')).concat(@get('x_range'))
      xr = @resolve_ref(xr)
      plots = xr.get('plots')
      if _.isArray(plots)
        plots = plots.concat(@)
        xr.set('plots', plots)
    for yr in _.values(@get('extra_y_ranges')).concat(@get('y_range'))
      yr = @resolve_ref(yr)
      plots = yr.get('plots')
      if _.isArray(plots)
        plots = plots.concat(@)
        yr.set('plots', plots)

    canvas = new Canvas.Model({
      map: @use_map ? false
      canvas_width: @get('plot_width'),
      canvas_height: @get('plot_height'),
      hidpi: @get('hidpi')
    })
    @set('canvas', canvas)
    @set('tool_manager', new ToolManager.Model({
      tools: @get('tools')
      toolbar_location: @get('toolbar_location')
      logo: @get('logo')
    }))

    logger.debug("Plot initialized")

  _doc_attached: () ->
    @get('canvas').attach_document(@document)
    frame = new CartesianFrame.Model({
      x_range: @get('x_range'),
      extra_x_ranges: @get('extra_x_ranges'),
      x_mapper_type: @get('x_mapper_type'),
      y_range: @get('y_range'),
      extra_y_ranges: @get('extra_y_ranges'),
      y_mapper_type: @get('y_mapper_type'),
    })
    frame.attach_document(@document)
    @set('frame', frame)
    
    # Add the panels that make up the layout
    @above_panel = new LayoutBox.Model()
    @above_panel.attach_document(@document)
    @below_panel = new LayoutBox.Model()
    @below_panel.attach_document(@document)
    @left_panel = new LayoutBox.Model()
    @left_panel.attach_document(@document)
    @right_panel = new LayoutBox.Model()
    @right_panel.attach_document(@document)

    logger.debug("Plot attached to document")

  get_layoutable_children: () ->
    children = [
      @above_panel,
      @below_panel,
      @left_panel,
      @right_panel,
      @get('canvas'),
      @get('frame')
    ]
    # Add the layout panels for each of the axes
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @get(side)
      for r in layout_renderers
        if r.panel?
          children.push(r.panel)
    return children

  get_edit_variables: () ->
    edit_variables = []
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = []

    min_border_top    = @get('min_border_top')
    min_border_bottom = @get('min_border_bottom')
    min_border_left   = @get('min_border_left')
    min_border_right  = @get('min_border_right')
    frame             = @get('frame')
    canvas            = @get('canvas')

    # Setup the sides of the panel
    constraints.push(GE(@above_panel._height, -min_border_top))
    constraints.push(EQ(frame._top, [-1, @above_panel._bottom]))
    constraints.push(EQ(@above_panel._top, [-1, canvas._top]))
    constraints.push(GE(@below_panel._height, -min_border_bottom))
    constraints.push(EQ(frame._bottom, [-1, @below_panel._top]))
    constraints.push(EQ(@below_panel._bottom, [-1, canvas._bottom]))
    constraints.push(GE(@left_panel._width, -min_border_left))
    constraints.push(EQ(frame._left, [-1, @left_panel._right]))
    constraints.push(EQ(@left_panel._left, [-1, canvas._left]))
    constraints.push(GE(@right_panel._width, -min_border_right))
    constraints.push(EQ(frame._right, [-1, @right_panel._left]))
    constraints.push(EQ(@right_panel._right, [-1, canvas._right]))

    # Position all the sides next to each other
    # We do this here as opposed to in the axis.coffee because they all relate
    # to the plot.
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @get(side)
      last = frame
      for r in layout_renderers
        if side == "above"
          constraints.push(EQ(last._top, [-1, r.panel._bottom]))
        if side == "below"
          constraints.push(EQ(last._bottom, [-1, r.panel._top]))
        if side == "left"
          constraints.push(EQ(last._left, [-1, r.panel._right]))
        if side == "right"
          constraints.push(EQ(last._right, [-1, r.panel._left]))
        last = r

    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())

    return constraints

  add_renderers: (new_renderers) ->
    renderers = @get('renderers')
    renderers = renderers.concat(new_renderers)
    @set('renderers', renderers)

  nonserializable_attribute_names: () ->
    super().concat(['canvas', 'tool_manager', 'frame', 'min_size'])

  serializable_attributes: () ->
    attrs = super()
    if 'renderers' of attrs
      attrs['renderers'] = _.filter(attrs['renderers'], (r) -> r.serializable_in_document())
    attrs

  mixins: [
    'line:outline_',
    'fill:border_',
    'fill:background_'
  ]

  props: ->
    return _.extend {}, super(), {
      plot_width:        [ p.Number,   600                    ]
      plot_height:       [ p.Number,   600                    ]
      h_symmetry:        [ p.Bool,     true                   ]
      v_symmetry:        [ p.Bool,     false                  ]

      above:             [ p.Array,    []                     ]
      below:             [ p.Array,    []                     ]
      left:              [ p.Array,    []                     ]
      right:             [ p.Array,    []                     ]

      renderers:         [ p.Array,    []                     ]

      x_range:           [ p.Instance                         ]
      extra_x_ranges:    [ p.Any,      {}                     ] # TODO (bev)
      y_range:           [ p.Instance                         ]
      extra_y_ranges:    [ p.Any,      {}                     ] # TODO (bev)

      x_mapper_type:     [ p.String,   'auto'                 ] # TODO (bev)
      y_mapper_type:     [ p.String,   'auto'                 ] # TODO (bev)

      tools:             [ p.Array,    []                     ]
      tool_events:       [ p.Instance, new ToolEvents.Model() ]
      toolbar_location:  [ p.Location, 'above'                ]
      logo:              [ p.String,   'normal'               ] # TODO (bev)

      lod_factor:        [ p.Number,   10                     ]
      lod_interval:      [ p.Number,   300                    ]
      lod_threshold:     [ p.Number,   2000                   ]
      lod_timeout:       [ p.Number,   500                    ]

      webgl:             [ p.Bool,     false                  ]
      hidpi:             [ p.Bool,     true                   ]
      responsive:        [ p.Bool,     false                  ]

      min_border:        [ p.Number,   50                     ]
      min_border_top:    [ p.Number,   50                     ]
      min_border_left:   [ p.Number,   50                     ]
      min_border_bottom: [ p.Number,   50                     ]
      min_border_right:  [ p.Number,   50                     ]
    }

  defaults: ->
    return _.extend {}, super(), {
      # overrides
      outline_line_color: '#aaaaaa'
      border_fill_color: "#ffffff",
      background_fill_color: "#ffffff",

      # internal
      min_size: 120
    }

module.exports =
  get_size_for_available_space: get_size_for_available_space
  Model: Plot
  View: PlotView
