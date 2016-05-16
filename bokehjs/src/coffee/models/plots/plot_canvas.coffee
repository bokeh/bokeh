_ = require "underscore"
$ = require "jquery"
Backbone = require "backbone"

Canvas = require "../canvas/canvas"
CartesianFrame = require "../canvas/cartesian_frame"
LayoutDOM = require "../layouts/layout_dom"
GlyphRenderer = require "../renderers/glyph_renderer"
Renderer = require "../renderers/renderer"
ColumnDataSource = require "../sources/column_data_source"
DataRange1d = require "../ranges/data_range1d"
Toolbar = require "../tools/toolbar"

build_views = require "../../common/build_views"
ToolEvents = require "../../common/tool_events"
UIEvents = require "../../common/ui_events"

enums = require "../../core/enums"
LayoutCanvas = require "../../core/layout/layout_canvas"
{EQ, GE, Strength, Variable} = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"
{throttle} = require "../../core/util/throttle"
update_panel_constraints = require("../../core/layout/side_panel").update_constraints

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

MIN_BORDER = 50

# TODO (bev) PlotView should not be a RendererView
class PlotCanvasView extends Renderer.View
  className: "bk-plot-wrapper"

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
    for id, tool_view of @tool_views
      tool_view.remove()

  initialize: (options) ->
    super(options)
    @pause()

    @_initial_state_info = {
      range: null                     # set later by set_initial_range()
      selection: {}                   # XXX: initial selection?
      dimensions: {
        width: @mget("canvas").get("width")
        height: @mget("canvas").get("height")
      }
    }

    # TODO (bev) titles should probably be a proper guide, then they could go
    # on any side, this will do to get the PR merged
    @title_panel = @model.above_panel
    @title_panel._anchor = @title_panel._bottom

    # compat, to be removed
    @frame = @mget('frame')
    @x_range = @frame.get('x_ranges')['default']
    @y_range = @frame.get('y_ranges')['default']
    @xmapper = @frame.get('x_mappers')['default']
    @ymapper = @frame.get('y_mappers')['default']

    @canvas = @mget('canvas')
    @canvas_view = new @canvas.default_view({'model': @canvas})

    @$el.append(@canvas_view.el)

    @canvas_view.render(true)

    # If requested, try enabling webgl
    if @mget('webgl') or window.location.search.indexOf('webgl=1') > 0
      if window.location.search.indexOf('webgl=0') == -1
        @init_webgl()

    @throttled_render = throttle(@render, 15) # TODO (bev) configurable

    @ui_event_bus = new UIEvents({
      toolbar: @mget('toolbar')
      hit_area: @canvas_view.$el
    })

    @renderer_views = {}
    @tool_views = {}

    @levels = {}
    for level in enums.RenderLevel
      @levels[level] = {}
    @build_levels()
    @bind_bokeh_events()

    toolbar_location = @mget('toolbar_location')
    if toolbar_location?
      toolbar_selector = '.bk-plot-' + toolbar_location
      logger.debug("attaching toolbar to #{toolbar_selector} for plot #{@model.id}")
      @tm_view = new Toolbar.View({
        model: @mget('toolbar')
        el: $("<div>").appendTo(@$(toolbar_selector))
        location: toolbar_location
      })
      @tm_view.render()

    @update_dataranges()

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
    frame = @model.get('frame')
    bounds = {}
    for k, v of @renderer_views
      bds = v.glyph?.bounds?()
      if bds?
        bounds[k] = bds

    follow_enabled = false
    has_bounds = false

    for xr in _.values(frame.get('x_ranges'))
      if xr instanceof DataRange1d.Model
        xr.update(bounds, 0, @model.id)
        if xr.get('follow')
          follow_enabled = true
      has_bounds = true if xr.get('bounds')?

    for yr in _.values(frame.get('y_ranges'))
      if yr instanceof DataRange1d.Model
        yr.update(bounds, 1, @model.id)
        if yr.get('follow')
          follow_enabled = true
      has_bounds = true if yr.get('bounds')?

    if follow_enabled and has_bounds
      logger.warn('Follow enabled so bounds are unset.')
      for xr in _.values(frame.get('x_ranges'))
        xr.set('bounds', null)
      for yr in _.values(frame.get('y_ranges'))
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
      @canvas_view.set_dims([info.dimensions.width, info.dimensions.height])

  reset_dimensions: () ->
    @canvas_view.set_dims([@canvas.get('canvas_width'), @canvas.get('canvas_height')])

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
    renderer_models = @mget("renderers")
    for tool_model in @mget("toolbar").tools
      synthetic = tool_model.get("synthetic_renderers")
      renderer_models = renderer_models.concat(synthetic)

    # should only bind events on NEW views and tools
    old_renderers = _.keys(@renderer_views)
    views = build_views(@renderer_views, renderer_models, @view_options())
    renderers_to_remove = _.difference(old_renderers, _.pluck(renderer_models, 'id'))

    for id_ in renderers_to_remove
      delete @levels.glyph[id_]

    tool_views = build_views(@tool_views, @mget('toolbar').tools, @view_options())

    for v in views
      level = v.mget('level')
      @levels[level][v.model.id] = v
      v.bind_bokeh_events()
      
    for tool_view in tool_views
      level = tool_view.mget('level')
      @levels[level][tool_view.model.id] = tool_view
      tool_view.bind_bokeh_events()
      @ui_event_bus.register_tool(tool_view)

    return this

  bind_bokeh_events: () ->
    for name, rng of @mget('frame').get('x_ranges')
      @listenTo(rng, 'change', @request_render)
    for name, rng of @mget('frame').get('y_ranges')
      @listenTo(rng, 'change', @request_render)
    @listenTo(@model, 'change:renderers', @build_levels)
    @listenTo(@model.toolbar, 'change:tools', @build_levels)
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
      @canvas_view.set_dims([width, height], trigger=false)

    @canvas_view.render(force_canvas)

    for k, v of @renderer_views
      if not @range_update_timestamp? or v.set_data_timestamp > @range_update_timestamp
        @update_dataranges()
        break

    ctx = @canvas_view.ctx
    title = @mget('title')
    if title
      @visuals.title_text.set_value(ctx)

    @update_constraints()

    # TODO (bev) OK this sucks, but the event from the solver update doesn't
    # reach the frame in time (sometimes) so force an update here for now
    @model.get('frame')._update_mappers()

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
      canvas = @canvas_view.get_canvas_element()
      ctx.glcanvas.width = canvas.width
      ctx.glcanvas.height = canvas.height
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
      src_offset = 0.0
      dst_offset = 0.5
      ctx.drawImage(ctx.glcanvas, src_offset, src_offset, ctx.glcanvas.width, ctx.glcanvas.height,
                                  dst_offset, dst_offset, ctx.glcanvas.width, ctx.glcanvas.height)
      logger.debug('drawing with WebGL')

    @_render_levels(ctx, ['overlay', 'tool'])

    if title
      vx = switch @visuals.title_text.text_align.value()
        when 'left'   then 0
        when 'center' then @canvas.get('width')/2
        when 'right'  then @canvas.get('width')
      vy = @title_panel.get('bottom') + @model.get('title_standoff')

      sx = @canvas.vx_to_sx(vx)
      sy = @canvas.vy_to_sy(vy)

      @visuals.title_text.set_value(ctx)
      ctx.fillText(title, sx, sy)

    if not @initial_range_info?
      @set_initial_range()

  update_constraints: () ->
    s = @model.document.solver()

    # Note: -1 to effectively dilate the canvas by 1px
    s.suggest_value(@frame._width, @canvas.get('width') - 1)
    s.suggest_value(@frame._height, @canvas.get('height') - 1)

    for model_id, view of @renderer_views
      if view.model.panel?
        update_panel_constraints(view)

    ctx = @canvas_view.ctx
    title = @mget('title')
    if title
      th = ctx.measureText(@mget('title')).ascent + @model.get('title_standoff')
      if th != @title_panel.get('height')
        s.suggest_value(@title_panel._height, th)

    s.update_variables(false)

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

class PlotCanvas extends LayoutDOM.Model
  type: 'PlotCanvas'
  default_view: PlotCanvasView

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
      use_hidpi: @get('hidpi')
    })
    @set('canvas', canvas)

    min_border = @get('min_border')
    if min_border?
      if not @get('min_border_top')?
        @set('min_border_top', min_border)
      if not @get('min_border_bottom')?
        @set('min_border_bottom', min_border)
      if not @get('min_border_left')?
        @set('min_border_left', min_border)
      if not @get('min_border_right')?
        @set('min_border_right', min_border)

    logger.debug("Plot initialized")

  _doc_attached: () ->
    canvas = @get('canvas')
    canvas.attach_document(@document)

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
    @above_panel = new LayoutCanvas.Model()
    @above_panel.attach_document(@document)
    @below_panel = new LayoutCanvas.Model()
    @below_panel.attach_document(@document)
    @left_panel = new LayoutCanvas.Model()
    @left_panel.attach_document(@document)
    @right_panel = new LayoutCanvas.Model()
    @right_panel.attach_document(@document)

    # Add panels for any side renderers
    # (Needs to be called in _doc_attached, so that panels can attach to the document.)
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @get(side)
      for r in layout_renderers
        r.add_panel(side)

    logger.debug("Plot attached to document")

  serializable_attributes: () ->
    attrs = super()
    if 'renderers' of attrs
      attrs['renderers'] = _.filter(attrs['renderers'], (r) -> r.serializable_in_document())
    attrs

  add_renderers: (new_renderers...) ->
    renderers = @get('renderers')
    renderers = renderers.concat(new_renderers)
    @set('renderers', renderers)

  add_layout: (renderer, side="center") ->
    if renderer.props.plot?
      renderer.plot = this

    @add_renderers(renderer)

    if side != 'center'
      renderer.add_panel(side)
      @set(side, @get(side).concat([renderer]))

  add_glyph: (glyph, source, attrs={}) ->
    if not source?
      source = new ColumnDataSource.Model()

    attrs = _.extend({}, attrs, {data_source: source, glyph: glyph})
    renderer = new GlyphRenderer.Model(attrs)

    @add_renderers(renderer)

    return renderer

  add_tools: (tools...) ->
    new_tools = for tool in tools
      if tool.overlay?
        @add_renderers(tool.overlay)

      if tool.plot?
        tool
      else
        # XXX: this part should be unnecessary, but you can't configure tool.plot
        # after construting a tool. When this limitation is lifted, remove this code.
        attrs = _.clone(tool.attributes)
        attrs.plot = this
        new tool.constructor(attrs)

    @set(@toolbar.tools, @get("toolbar").tools.concat(new_tools))

  @mixins ['line:outline_', 'text:title_', 'fill:background_', 'fill:border_']

  @define {
      title:             [ p.String,   ''                     ]
      title_standoff:    [ p.Number,   8                      ]

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

      tool_events:       [ p.Instance, () -> new ToolEvents.Model() ]
      toolbar_location:  [ p.Location, 'above'                ]

      lod_factor:        [ p.Number,   10                     ]
      lod_interval:      [ p.Number,   300                    ]
      lod_threshold:     [ p.Number,   2000                   ]
      lod_timeout:       [ p.Number,   500                    ]

      webgl:             [ p.Bool,     false                  ]
      hidpi:             [ p.Bool,     true                   ]

      min_border:        [ p.Number,   MIN_BORDER             ]
      min_border_top:    [ p.Number,   null                   ]
      min_border_left:   [ p.Number,   null                   ]
      min_border_bottom: [ p.Number,   null                   ]
      min_border_right:  [ p.Number,   null                   ]
    }

  @override {
    title_text_font_size: "20pt"
    title_text_align: "center"
    title_text_baseline: "alphabetic"
    outline_line_color: '#aaaaaa'
    border_fill_color: "#ffffff"
    background_fill_color: "#ffffff"
    responsive: 'fixed'
  }

  @internal {
    canvas:       [ p.Instance ]
    toolbar:      [ p.Instance ]
    frame:        [ p.Instance ]
  }

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
    edit_variables = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()
    constraints = constraints.concat(@_get_constant_constraints())
    constraints = constraints.concat(@_get_side_constraints())
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())
    return constraints

  _get_constant_constraints: () ->
    constraints = []

    # Add the constraints that always apply for a plot
    min_border_top    = @get('min_border_top')
    min_border_bottom = @get('min_border_bottom')
    min_border_left   = @get('min_border_left')
    min_border_right  = @get('min_border_right')
    frame             = @get('frame')
    canvas            = @get('canvas')

    # Set the border constraints
    constraints.push(GE(@above_panel._height, -min_border_top))
    constraints.push(GE(@below_panel._height, -min_border_bottom))
    constraints.push(GE(@left_panel._width, -min_border_left))
    constraints.push(GE(@right_panel._width, -min_border_right))

    # Set panel top and bottom related to canvas and frame
    constraints.push(EQ(@above_panel._top, [-1, canvas._top]))
    constraints.push(EQ(@above_panel._bottom, [-1, frame._top]))
    constraints.push(EQ(@below_panel._bottom, [-1, canvas._bottom]))
    constraints.push(EQ(@below_panel._top, [-1, frame._bottom]))
    constraints.push(EQ(@left_panel._left, [-1, canvas._left]))
    constraints.push(EQ(@left_panel._right, [-1, frame._left]))
    constraints.push(EQ(@right_panel._right, [-1, canvas._right]))
    constraints.push(EQ(@right_panel._left, [-1, frame._right]))

    # Plot sides align
    constraints.push(EQ(@above_panel._height, [-1, @_top]))
    constraints.push(EQ(@above_panel._height, [-1, canvas._top], frame._top))
    constraints.push(EQ(@below_panel._height, [-1, @_height], @_bottom))
    constraints.push(EQ(@below_panel._height, [-1, frame._bottom]))
    constraints.push(EQ(@left_panel._width, [-1, @_left]))
    constraints.push(EQ(@left_panel._width, [-1, frame._left]))
    constraints.push(EQ(@right_panel._width, [-1, @_width], @_right))
    constraints.push(EQ(@right_panel._width, [-1, canvas._right], frame._right))

    return constraints

  _get_side_constraints: () ->
    constraints = []
    for side in ['above', 'below', 'left', 'right']
      layout_renderers = @get(side)
      last = @get('frame')
      for r in layout_renderers
        # Stack together the renderers
        if side == "above"
          constraints.push(EQ(last.panel._top, [-1, r.panel._bottom]))
        if side == "below"
          constraints.push(EQ(last.panel._bottom, [-1, r.panel._top]))
        if side == "left"
          constraints.push(EQ(last.panel._left, [-1, r.panel._right]))
        if side == "right"
          constraints.push(EQ(last.panel._right, [-1, r.panel._left]))
        last = r
      if layout_renderers.length != 0
        # Set panel extent to match the side renderers (e.g. axes)
        if side == "above"
          constraints.push(EQ(last.panel._top, [-1, @above_panel._top]))
        if side == "below"
          constraints.push(EQ(last.panel._bottom, [-1, @below_panel._bottom]))
        if side == "left"
          constraints.push(EQ(last.panel._left, [-1, @left_panel._left]))
        if side == "right"
          constraints.push(EQ(last.panel._right, [-1, @right_panel._right]))
    return constraints


module.exports =
  Model: PlotCanvas
  View: PlotCanvasView
