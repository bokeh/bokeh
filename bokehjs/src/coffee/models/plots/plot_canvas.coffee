import {Canvas} from "../canvas/canvas"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {DataRange1d} from "../ranges/data_range1d"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {LayoutDOM} from "../layouts/layout_dom"

import {build_views} from "core/build_views"
import {UIEvents} from "core/ui_events"
import {LODStart, LODEnd} from "core/bokeh_events"
import {LayoutCanvas} from "core/layout/layout_canvas"
import {Visuals} from "core/visuals"
import {BokehView} from "core/bokeh_view"
import {EQ, GE} from "core/layout/solver"
import {logger} from "core/logging"
import * as enums from "core/enums"
import * as p from "core/properties"
import {throttle} from "core/util/throttle"
import {isStrictNaN} from "core/util/types"
import {difference, sortBy} from "core/util/array"
import {extend, values, isEmpty} from "core/util/object"
import {defer} from "core/util/callback"
import {update_constraints as update_panel_constraints} from "core/layout/side_panel"

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

global_glcanvas = null

export class PlotCanvasView extends BokehView
  className: "bk-plot-wrapper"

  state: { history: [], index: -1 }

  view_options: () -> extend({plot_view: @, parent: @}, @options)

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
    for _, view of @renderer_views
      view.remove()
    @renderer_views = {}

    for _, view of @tool_views
      view.remove()
    @tool_views = {}

    @canvas_view.remove()
    @canvas_view = null

    super()

  initialize: (options) ->
    super(options)
    @pause()

    @lod_started = false
    @visuals = new Visuals(@model.plot)

    @_initial_state_info = {
      range: null                     # set later by set_initial_range()
      selection: {}                   # XXX: initial selection?
      dimensions: {
        width: @model.canvas.width
        height: @model.canvas.height
      }
    }

    # compat, to be removed
    @frame = @model.frame
    @x_range = @frame.x_ranges['default']
    @y_range = @frame.y_ranges['default']
    @xmapper = @frame.x_mappers['default']
    @ymapper = @frame.y_mappers['default']

    @canvas = @model.canvas
    @canvas_view = new @canvas.default_view({model: @canvas, parent: @})
    @el.appendChild(@canvas_view.el)
    @canvas_view.render()

    # If requested, try enabling webgl
    if @model.plot.webgl
      @init_webgl()

    @throttled_render = throttle((() => @trigger("force_render")), 15) # TODO (bev) configurable

    @ui_event_bus = new UIEvents(@, @model.toolbar, @canvas_view.el, @model.plot)

    @levels = {}
    for level in enums.RenderLevel
      @levels[level] = {}

    @renderer_views = {}
    @tool_views = {}

    @build_levels()
    @build_tools()

    @bind_bokeh_events()
    @update_dataranges()

    @unpause()
    logger.debug("PlotView initialized")

    return this

  get_canvas_element: () ->
    return @canvas_view.ctx.canvas

  set_cursor: (cursor="default") ->
    @canvas_view.el.style.cursor = cursor

  @getters {
    canvas_overlays: () -> @el.querySelector('.bk-canvas-overlays')
  }

  init_webgl: () ->
    ctx = @canvas_view.ctx

    # We use a global invisible canvas and gl context. By having a global context,
    # we avoid the limitation of max 16 contexts that most browsers have.
    glcanvas = global_glcanvas
    if not glcanvas?
      global_glcanvas = glcanvas = document.createElement('canvas')
      opts = {'premultipliedAlpha': true}  # premultipliedAlpha is true by default
      glcanvas.gl = glcanvas.getContext("webgl", opts) || glcanvas.getContext("experimental-webgl", opts)

    # If WebGL is available, we store a reference to the gl canvas on
    # the ctx object, because that's what gets passed everywhere.
    if glcanvas.gl?
      ctx.glcanvas = glcanvas
    else
      logger.warn('WebGL is not supported, falling back to 2D canvas.')

  prepare_webgl: (ratio, frame_box) ->
    # Prepare WebGL for a drawing pass
    ctx = @canvas_view.ctx
    canvas = @canvas_view.get_canvas_element()
    if ctx.glcanvas
      # Sync canvas size
      ctx.glcanvas.width = canvas.width
      ctx.glcanvas.height = canvas.height
      # Prepare GL for drawing
      gl = ctx.glcanvas.gl
      gl.viewport(0, 0, ctx.glcanvas.width, ctx.glcanvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT)
      # Clipping
      gl.enable(gl.SCISSOR_TEST)
      flipped_top = ctx.glcanvas.height - ratio * (frame_box[1] + frame_box[3])
      gl.scissor(ratio * frame_box[0], flipped_top, ratio * frame_box[2], ratio * frame_box[3])
      # Setup blending
      gl.enable(gl.BLEND)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # premultipliedAlpha == true
      #gl.blendFuncSeparate(gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA, gl.ONE_MINUS_DST_ALPHA, gl.ONE)  # Without premultipliedAlpha == false

  blit_webgl: (ratio) ->
    # This should be called when the ctx has no state except the HIDPI transform
    ctx = @canvas_view.ctx
    if ctx.glcanvas
      # Blit gl canvas into the 2D canvas. To do 1-on-1 blitting, we need
      # to remove the hidpi transform, then blit, then restore.
      # ctx.globalCompositeOperation = "source-over"  -> OK; is the default
      logger.debug('drawing with WebGL')
      ctx.restore()
      ctx.drawImage(ctx.glcanvas, 0, 0)
      # Set back hidpi transform
      ctx.save()
      ctx.scale(ratio, ratio)
      ctx.translate(0.5, 0.5)

  update_dataranges: () ->
    # Update any DataRange1ds here
    frame = @model.frame
    bounds = {}
    log_bounds = {}

    calculate_log_bounds = false
    for r in values(frame.x_ranges).concat(values(frame.y_ranges))
      if r instanceof DataRange1d
        if r.mapper_hint == "log"
          calculate_log_bounds = true

    for k, v of @renderer_views
      bds = v.glyph?.bounds?()
      if bds?
        bounds[k] = bds
      if calculate_log_bounds
        log_bds = v.glyph?.log_bounds?()
        if log_bds?
          log_bounds[k] = log_bds

    follow_enabled = false
    has_bounds = false

    for xr in values(frame.x_ranges)
      if xr instanceof DataRange1d
        bounds_to_use = if xr.mapper_hint == "log" then log_bounds else bounds
        xr.update(bounds_to_use, 0, @model.id)
        if xr.follow
          follow_enabled = true
      has_bounds = true if xr.bounds?

    for yr in values(frame.y_ranges)
      if yr instanceof DataRange1d
        bounds_to_use = if yr.mapper_hint == "log" then log_bounds else bounds
        yr.update(bounds_to_use, 1, @model.id)
        if yr.follow
          follow_enabled = true
      has_bounds = true if yr.bounds?

    if follow_enabled and has_bounds
      logger.warn('Follow enabled so bounds are unset.')
      for xr in values(frame.x_ranges)
        xr.bounds = null
      for yr in values(frame.y_ranges)
        yr.bounds = null

    @range_update_timestamp = Date.now()

  map_to_screen: (x, y, x_name='default', y_name='default') ->
    @frame.map_to_screen(x, y, @canvas, x_name, y_name)

  push_state: (type, info) ->
    prev_info = @state.history[@state.index]?.info or {}
    info = extend({}, @_initial_state_info, prev_info, info)

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
    @update_dimensions(@canvas.initial_width, @canvas.initial_height)

  update_dimensions: (width, height) ->
    @pause()
    @model.plot.width = width
    @model.plot.height = height
    @parent.resize()  # parent because this view doesn't participate in layout hierarchy
    @unpause()

  get_selection: () ->
    selection = []
    for renderer in @model.plot.renderers
      if renderer instanceof GlyphRenderer
        selected = renderer.data_source.selected
        selection[renderer.id] = selected
    selection

  update_selection: (selection) ->
    for renderer in @model.plot.renderers
      if renderer not instanceof GlyphRenderer
        continue
      ds = renderer.data_source
      if selection?
        if renderer.id in selection
          ds.selected = selection[renderer.id]
      else
        ds.selection_manager.clear()

  reset_selection: () ->
    @update_selection(null)

  _update_ranges_together: (range_info_iter) ->
    # Get weight needed to scale the diff of the range to honor interval limits
    weight = 1.0
    for [rng, range_info] in range_info_iter
      weight = Math.min(weight, @_get_weight_to_constrain_interval(rng, range_info))
    # Apply shared weight to all ranges
    if weight < 1
      for [rng, range_info] in range_info_iter
        range_info['start'] = weight * range_info['start'] + (1-weight) * rng.start
        range_info['end'] = weight * range_info['end'] + (1-weight) * rng.end

  _update_ranges_individually: (range_info_iter, is_panning, is_scrolling) ->
    hit_bound = false
    for [rng, range_info] in range_info_iter
      # Is this a reversed range?
      reversed = (rng.start > rng.end)

      # Limit range interval first. Note that for scroll events,
      # the interval has already been limited for all ranges simultaneously
      if not is_scrolling
        weight = @_get_weight_to_constrain_interval(rng, range_info)
        if weight < 1
            range_info['start'] = weight * range_info['start'] + (1-weight) * rng.start
            range_info['end'] = weight * range_info['end'] + (1-weight) * rng.end

      # Prevent range from going outside limits
      # Also ensure that range keeps the same delta when panning/scrolling
      if rng.bounds?
        min = rng.bounds[0]
        max = rng.bounds[1]
        new_interval = Math.abs(range_info['end'] - range_info['start'])

        if reversed
          if min?
            if min >= range_info['end']
              hit_bound = true
              range_info['end'] = min
              if is_panning? or is_scrolling?
                range_info['start'] = min + new_interval
          if max?
            if max <= range_info['start']
              hit_bound = true
              range_info['start'] = max
              if is_panning? or is_scrolling?
                range_info['end'] = max - new_interval
        else
          if min?
            if min >= range_info['start']
              hit_bound = true
              range_info['start'] = min
              if is_panning? or is_scrolling?
                range_info['end'] = min + new_interval
          if max?
            if max <= range_info['end']
              hit_bound = true
              range_info['end'] = max
              if is_panning? or is_scrolling?
                range_info['start'] = max - new_interval

    # Cancel the event when hitting a bound while scrolling. This ensures that
    # the scroll-zoom tool maintains its focus position. Disabling the next
    # two lines would result in a more "gliding" behavior, allowing one to
    # zoom out more smoothly, at the cost of losing the focus position.
    if is_scrolling and hit_bound
      return

    for [rng, range_info] in range_info_iter
      rng.have_updated_interactively = true
      if rng.start != range_info['start'] or rng.end != range_info['end']
          rng.setv(range_info)

  _get_weight_to_constrain_interval: (rng, range_info) ->
      # Get the weight by which a range-update can be applied
      # to still honor the interval limits (including the implicit
      # max interval imposed by the bounds)
      min_interval = rng.min_interval
      max_interval = rng.max_interval
      weight = 1.0

      # Express bounds as a max_interval. By doing this, the application of
      # bounds and interval limits can be applied independent from each-other.
      if rng.bounds?
        [min, max] = rng.bounds
        if min? and max?
          max_interval2 = Math.abs(max - min)
          max_interval = if max_interval? then Math.min(max_interval, max_interval2) else max_interval2

      if min_interval? || max_interval?
        old_interval = Math.abs(rng.end - rng.start)
        new_interval = Math.abs(range_info['end'] - range_info['start'])
        if min_interval > 0 and new_interval < min_interval
            weight = (old_interval - min_interval) / (old_interval - new_interval)
        if max_interval > 0 and new_interval > max_interval
            weight = (max_interval - old_interval) / (new_interval - old_interval)
        weight = Math.max(0.0, Math.min(1.0, weight))
      return weight

  update_range: (range_info, is_panning, is_scrolling) ->
    @pause
    if not range_info?
      for name, rng of @frame.x_ranges
        rng.reset()
      for name, rng of @frame.y_ranges
        rng.reset()
      @update_dataranges()
    else
      range_info_iter = []
      for name, rng of @frame.x_ranges
        range_info_iter.push([rng, range_info.xrs[name]])
      for name, rng of @frame.y_ranges
        range_info_iter.push([rng, range_info.yrs[name]])
      if is_scrolling
        @_update_ranges_together(range_info_iter)  # apply interval bounds while keeping aspect
      @_update_ranges_individually(range_info_iter, is_panning, is_scrolling)
    @unpause()

  reset_range: () ->
    @update_range(null)

  build_levels: () ->
    renderer_models = @model.plot.all_renderers

    # should only bind events on NEW views
    old_renderers = Object.keys(@renderer_views)
    new_renderer_views = build_views(@renderer_views, renderer_models, @view_options())
    renderers_to_remove = difference(old_renderers, (model.id for model in renderer_models))

    for id_ in renderers_to_remove
      delete @levels.glyph[id_]

    for view in new_renderer_views
      @levels[view.model.level][view.model.id] = view
      view.bind_bokeh_events()

    return @

  get_renderer_views: () ->
    (@levels[r.level][r.id] for r in @model.plot.renderers)

  build_tools: () ->
    tool_models = @model.plot.toolbar.tools
    new_tool_views = build_views(@tool_views, tool_models, @view_options())

    for tool_view in new_tool_views
      tool_view.bind_bokeh_events()
      @ui_event_bus.register_tool(tool_view)

  bind_bokeh_events: () ->
    @listenTo(@, "force_render", () => @render())
    for name, rng of @model.frame.x_ranges
      @listenTo(rng, 'change', @request_render)
    for name, rng of @model.frame.y_ranges
      @listenTo(rng, 'change', @request_render)
    @listenTo(@model.plot, 'change:renderers', () => @build_levels())
    @listenTo(@model.plot.toolbar, 'change:tools', () => @build_levels(); @build_tools())
    @listenTo(@model.plot, 'change', @request_render)
    @listenTo(@model.plot, 'destroy', () => @remove())
    @listenTo(@solver, 'layout_update', () => @model.frame._update_mappers())
    @listenTo(@solver, 'layout_update', () => @request_render())
    @listenTo(@solver, 'layout_update', () =>
      @model.plot.setv({
        inner_width: Math.round(@frame.width)
        inner_height: Math.round(@frame.height)
        layout_width: Math.round(@canvas.width)
        layout_height: Math.round(@canvas.height)
      })
    )
    @listenTo(@solver, 'resize', () => @_on_resize())
    @listenTo(@canvas, 'change:pixel_ratio', () => @request_render())

  set_initial_range : () ->
    # check for good values for ranges before setting initial range
    good_vals = true
    xrs = {}
    for name, rng of @frame.x_ranges
      if (not rng.start? or not rng.end? or isStrictNaN(rng.start + rng.end))
        good_vals = false
        break
      xrs[name] = { start: rng.start, end: rng.end }
    if good_vals
      yrs = {}
      for name, rng of @frame.y_ranges
        if (not rng.start? or not rng.end? or isStrictNaN(rng.start + rng.end))
          good_vals = false
          break
        yrs[name] = { start: rng.start, end: rng.end }
    if good_vals
      @_initial_state_info.range = @initial_range_info = {
        xrs: xrs
        yrs: yrs
      }
      logger.debug("initial ranges set")
    else
      logger.warn('could not set initial ranges')

  render: () ->
    logger.trace("PlotCanvas.render() for #{@model.id}")

    if Date.now() - @interactive_timestamp < @model.plot.lod_interval
      if not @lod_started
        @model.plot.trigger_event(new LODStart({}))
        @lod_started = true

      @interactive = true
      lod_timeout = @model.plot.lod_timeout
      setTimeout(() =>
          if @interactive and (Date.now() - @interactive_timestamp) > lod_timeout
            @interactive = false
          @request_render()
        , lod_timeout)
    else
      @interactive = false
      if @lod_started
        @model.plot.trigger_event(new LODEnd({}))
        @lod_started = false

    for k, v of @renderer_views
      if not @range_update_timestamp? or v.set_data_timestamp > @range_update_timestamp
        @update_dataranges()
        break

    # AK: seems weird to me that this is here, but get solver errors if I remove it
    @update_constraints()

    # TODO (bev) OK this sucks, but the event from the solver update doesn't
    # reach the frame in time (sometimes) so force an update here for now
    @model.frame._update_mappers()

    ctx = @canvas_view.ctx
    ctx.pixel_ratio = ratio = @canvas_view.pixel_ratio  # Also store on cts for WebGL

    # Set hidpi-transform
    ctx.save()  # Save default state, do *after* getting ratio, cause setting canvas.width resets transforms
    ctx.scale(ratio, ratio)
    ctx.translate(0.5, 0.5)

    frame_box = [
      @canvas.vx_to_sx(@frame.left),
      @canvas.vy_to_sy(@frame.top),
      @frame.width,
      @frame.height,
    ]

    @_map_hook(ctx, frame_box)
    @_paint_empty(ctx, frame_box)

    @prepare_webgl(ratio, frame_box)

    ctx.save()
    if @visuals.outline_line.doit
      @visuals.outline_line.set_value(ctx)
      ctx.strokeRect.apply(ctx, frame_box)
    ctx.restore()

    @_render_levels(ctx, ['image', 'underlay', 'glyph'], frame_box)
    @blit_webgl(ratio)
    @_render_levels(ctx, ['annotation'], frame_box)
    @_render_levels(ctx, ['overlay'])

    if not @initial_range_info?
      @set_initial_range()

    ctx.restore()  # Restore to default state

    @parent.resize()  # parent because this view doesn't participate in layout hierarchy

    event = new Event("bokeh:rendered", {detail: @})
    window.dispatchEvent(event)

  _on_resize: () ->
    # Set the plot and canvas to the current model's size
    # This gets called upon solver resize events
    width = @model._width._value
    height = @model._height._value

    @canvas_view.set_dims([width, height], true)  # this indirectly calls @request_render

    # Prepare the canvas size, taking HIDPI into account. Note that this may cause
    # a resize of the canvas, which means that any previous calls to ctx.save() may be undone.
    @canvas_view.prepare_canvas()

    @update_constraints()

    # This allows the plot canvas to be positioned around the toolbar
    @el.style.position = 'absolute'
    @el.style.left = "#{@model._dom_left._value}px"
    @el.style.top = "#{@model._dom_top._value}px"
    @el.style.width = "#{@model._width._value}px"
    @el.style.height = "#{@model._height._value}px"

  update_constraints: () ->
    # Note: -1 to effectively dilate the canvas by 1px
    @solver.suggest_value(@frame._width, @canvas.width - 1)
    @solver.suggest_value(@frame._height, @canvas.height - 1)

    for model_id, view of @renderer_views
      if view.model.panel?
        update_panel_constraints(view)

    @solver.update_variables(false)

  _render_levels: (ctx, levels, clip_region) ->
    ctx.save()

    if clip_region?
      ctx.beginPath()
      ctx.rect.apply(ctx, clip_region)
      ctx.clip()
      ctx.beginPath()

    indices = {}
    for renderer, i in @model.plot.renderers
      indices[renderer.id] = i

    sortKey = (renderer_view) -> indices[renderer_view.model.id]

    for level in levels
      renderer_views = sortBy(values(@levels[level]), sortKey)

      for renderer_view in renderer_views
        renderer_view.render()

    ctx.restore()

  _map_hook: (ctx, frame_box) ->

  _paint_empty: (ctx, frame_box) ->
    ctx.clearRect(0, 0,  @canvas_view.model.width, @canvas_view.model.height)
    if @visuals.border_fill.doit
      @visuals.border_fill.set_value(ctx)
      ctx.fillRect(0, 0,  @canvas_view.model.width, @canvas_view.model.height)
      ctx.clearRect(frame_box...)
    if @visuals.background_fill.doit
      @visuals.background_fill.set_value(ctx)
      ctx.fillRect(frame_box...)

  save: (name) ->
    canvas = @get_canvas_element()

    if canvas.msToBlob?
      blob = canvas.msToBlob()
      window.navigator.msSaveBlob(blob, name)
    else
      link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = name
      link.target = "_blank"
      link.dispatchEvent(new MouseEvent('click'))

export class PlotCanvas extends LayoutDOM
  type: 'PlotCanvas'
  default_view: PlotCanvasView

  initialize: (attrs, options) ->
    super(attrs, options)

    @canvas = new Canvas({
      map: @use_map ? false
      initial_width: @plot.plot_width,
      initial_height: @plot.plot_height,
      use_hidpi: @plot.hidpi
    })

    @frame = new CartesianFrame({
      x_range: @plot.x_range,
      extra_x_ranges: @plot.extra_x_ranges,
      x_mapper_type: @plot.x_mapper_type,
      y_range: @plot.y_range,
      extra_y_ranges: @plot.extra_y_ranges,
      y_mapper_type: @plot.y_mapper_type,
    })

    @above_panel = new LayoutCanvas()
    @below_panel = new LayoutCanvas()
    @left_panel = new LayoutCanvas()
    @right_panel = new LayoutCanvas()

    logger.debug("PlotCanvas initialized")

  add_renderer_to_canvas_side: (renderer, side) ->
    # Calling this method after a plot has been initialized may (will?)
    # fail because the new constraints from the panel may
    # not be added to the solver.
    #
    # TODO (bird): We could make it more formal that in order for
    # a renderer to be available as an off-center item, it needs an add_panel
    # method. Currently axis and annotation have these.
    #
    # TODO (bird): Should we actually just throw an error if you try
    # to call this for a center renderer to help with clarity.
    if side != 'center'
      renderer.add_panel(side)

  _doc_attached: () ->
    @canvas.attach_document(@document)
    @frame.attach_document(@document)
    @above_panel.attach_document(@document)
    @below_panel.attach_document(@document)
    @left_panel.attach_document(@document)
    @right_panel.attach_document(@document)
    logger.debug("PlotCanvas attached to document")

  @override {
    # We should find a way to enforce this
    sizing_mode: 'stretch_both'
  }

  @internal {
    plot:         [ p.Instance ]
    toolbar:      [ p.Instance ]
    canvas:       [ p.Instance ]
    frame:        [ p.Instance ]
  }

  get_layoutable_children: () ->
    children = [
      @above_panel, @below_panel,
      @left_panel, @right_panel,
      @canvas, @frame,
    ]

    collect_panels = (layout_renderers) ->
      for r in layout_renderers
        if r.panel?
          children.push(r.panel)

    collect_panels(@plot.above)
    collect_panels(@plot.below)
    collect_panels(@plot.left)
    collect_panels(@plot.right)

    return children

  get_edit_variables: () ->
    edit_variables = []
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
    min_border_top    = @plot.min_border_top
    min_border_bottom = @plot.min_border_bottom
    min_border_left   = @plot.min_border_left
    min_border_right  = @plot.min_border_right

    # Create the constraints that always apply for a plot
    constraints = []

    # Set the border constraints
    constraints.push(GE( @above_panel._height, -min_border_top    ))
    constraints.push(GE( @below_panel._height, -min_border_bottom ))
    constraints.push(GE( @left_panel._width,   -min_border_left   ))
    constraints.push(GE( @right_panel._width,  -min_border_right  ))

    # Set panel top and bottom related to canvas and frame
    constraints.push(EQ( @above_panel._top,    [-1, @canvas._top]    ))
    constraints.push(EQ( @above_panel._bottom, [-1, @frame._top]     ))
    constraints.push(EQ( @below_panel._bottom, [-1, @canvas._bottom] ))
    constraints.push(EQ( @below_panel._top,    [-1, @frame._bottom]  ))
    constraints.push(EQ( @left_panel._left,    [-1, @canvas._left]   ))
    constraints.push(EQ( @left_panel._right,   [-1, @frame._left]    ))
    constraints.push(EQ( @right_panel._right,  [-1, @canvas._right]  ))
    constraints.push(EQ( @right_panel._left,   [-1, @frame._right]   ))

    # Plot sides align
    constraints.push(EQ( @above_panel._height, [-1, @_top]                         ))
    constraints.push(EQ( @above_panel._height, [-1, @canvas._top], @frame._top     ))
    constraints.push(EQ( @below_panel._height, [-1, @_height], @_bottom            ))
    constraints.push(EQ( @below_panel._height, [-1, @frame._bottom]                ))
    constraints.push(EQ( @left_panel._width,   [-1, @_left]                        ))
    constraints.push(EQ( @left_panel._width,   [-1, @frame._left]                  ))
    constraints.push(EQ( @right_panel._width,  [-1, @_width], @_right              ))
    constraints.push(EQ( @right_panel._width,  [-1, @canvas._right], @frame._right ))

    return constraints

  _get_side_constraints: () ->
    constraints = []
    sides = [['above', @plot.above], ['below', @plot.below],
             ['left', @plot.left], ['right', @plot.right]]
    for [side, layout_renderers] in sides
      last = @frame
      for r in layout_renderers
        # Stack together the renderers
        constraint = switch side
          when "above" then EQ(last.panel._top, [-1, r.panel._bottom])
          when "below" then EQ(last.panel._bottom, [-1, r.panel._top])
          when "left"  then EQ(last.panel._left, [-1, r.panel._right])
          when "right" then EQ(last.panel._right, [-1, r.panel._left])
        constraints.push(constraint)
        last = r
      if layout_renderers.length != 0
        # Set panel extent to match the side renderers (e.g. axes)
        constraint = switch side
          when "above" then EQ(last.panel._top, [-1, @above_panel._top])
          when "below" then EQ(last.panel._bottom, [-1, @below_panel._bottom])
          when "left"  then EQ(last.panel._left, [-1, @left_panel._left])
          when "right" then EQ(last.panel._right, [-1, @right_panel._right])
        constraints.push(constraint)
    return constraints

  # TODO: This is less than awesome - this is here purely for tests to pass. Need to
  # find a better way, but this was expedient for now.
  plot_canvas: () ->
    return @
