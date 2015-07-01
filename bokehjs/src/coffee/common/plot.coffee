_ = require "underscore"
Backbone = require "backbone"
if global._bokehTest?
  kiwi = {}  # TODO Make work
else
  kiwi = require "kiwi"
  {Expression, Constraint, Operator} = kiwi
  {Eq, Le, Ge} = Operator
build_views = require "./build_views"
Canvas = require "./canvas"
CartesianFrame = require "./cartesian_frame"
ContinuumView = require "./continuum_view"
UIEvents = require "./ui_events"
HasParent = require "./has_parent"
LayoutBox = require "./layout_box"
{logger} = require "./logging"
plot_utils = require "./plot_utils"
Solver = require "./solver"
ToolManager = require "./tool_manager"
plot_template = require "./plot_template"
properties = require "./properties"


class PlotView extends ContinuumView
  className: "bk-plot"
  template: plot_template

  view_options: () ->
    _.extend({plot_model: @model, plot_view: @}, @options)

  pause: () ->
    @is_paused = true

  unpause: () ->
    @is_paused = false
    @request_render()

  request_render: () =>
    if not @is_paused
      @throttled_render(true)
    return

  initialize: (options) ->
    super(options)
    @pause()

    @model.initialize_layout(@model.solver)

    # compat, to be removed
    @frame = @mget('frame')
    @x_range = @frame.get('x_ranges')['default']
    @y_range = @frame.get('y_ranges')['default']
    @xmapper = @frame.get('x_mappers')['default']
    @ymapper = @frame.get('y_mappers')['default']

    @$el.html(@template())

    @canvas = @mget('canvas')
    @canvas_view = new @canvas.default_view({'model': @canvas})

    @$('.bk-plot-canvas-wrapper').append(@canvas_view.el)

    @canvas_view.render()

    @throttled_render = plot_utils.throttle_animation(@render, 15)

    @outline_props = new properties.Line({obj: @model, prefix: 'outline_'})
    @title_props = new properties.Text({obj: @model, prefix: 'title_'})

    @renderers = {}
    @tools = {}

    @levels = {}
    for level in plot_utils.LEVELS
      @levels[level] = {}
    @build_levels()
    @bind_bokeh_events()

    @model.add_constraints(@canvas.solver)
    @listenTo(@canvas.solver, 'layout_update', @request_render)

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
      })

    @update_dataranges()

    @unpause()

    logger.debug("PlotView initialized")

    return this

  update_dataranges: () ->
    # Update any DataRange1ds here
    frame = @model.get('frame')
    bounds = {}
    for k, v of @renderers
      bds = v.glyph?.bounds?()
      if bds?
        bounds[k] = bds
    for xr in _.values(frame.get('x_ranges'))
      xr.update?(bounds, 0, @)
    for yr in _.values(frame.get('y_ranges'))
      yr.update?(bounds, 1, @)
    @range_update_timestamp = Date.now()

  map_to_screen: (x, y, x_name='default', y_name='default') ->
    @frame.map_to_screen(x, y, @canvas, x_name, y_name)

  update_range: (range_info) ->
    if not range_info?
      range_info = @initial_range_info
    @pause()
    for name, rng of @frame.get('x_ranges')
      if rng.get('start') != range_info.xrs[name]['start'] or
          rng.get('end') != range_info.xrs[name]['end']
        rng.set(range_info.xrs[name])
        rng.get('callback')?.execute(@model)
    for name, rng of @frame.get('y_ranges')
      if rng.get('start') != range_info.yrs[name]['start'] or
          rng.get('end') != range_info.yrs[name]['end']
        rng.set(range_info.yrs[name])
        rng.get('callback')?.execute(@model)
    @unpause()

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
    for name, rng of @mget('frame').get('x_ranges')
      @listenTo(rng, 'change', @request_render)
    for name, rng of @mget('frame').get('y_ranges')
      @listenTo(rng, 'change', @request_render)
    @listenTo(@model, 'change:renderers', @build_levels)
    @listenTo(@model, 'change:tool', @build_levels)
    @listenTo(@model, 'change', @request_render)
    @listenTo(@model, 'destroy', () => @remove())

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
      @initial_range_info = {
        xrs: xrs
        yrs: yrs
      }
      logger.debug("initial ranges set")
    else
      logger.warn('could not set initial ranges')

  render: (force_canvas=false) ->
    logger.trace("Plot.render(force_canvas=#{force_canvas})")

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
      @canvas._set_dims([width, height], trigger=false)

    super()
    @canvas_view.render(force_canvas)

    if @tm_view?
      @tm_view.render()

    ctx = @canvas_view.ctx

    frame = @model.get('frame')
    canvas = @model.get('canvas')

    for k, v of @renderers
      if v.model.update_layout?
        v.model.update_layout(v, @canvas.solver)

    for k, v of @renderers
      if v.set_data_timestamp > @range_update_timestamp?
        @update_dataranges()
        break

    title = @mget('title')
    if title
      @title_props.set_value(@canvas_view.ctx)
      th = ctx.measureText(@mget('title')).ascent + @model.get('title_standoff')
      if th != @model.title_panel.get('height')
        @model.title_panel.set('height', th)

    # Note: -1 to effectively dilate the canvas by 1px
    @model.get('frame').set('width', canvas.get('width')-1)
    @model.get('frame').set('height', canvas.get('height')-1)

    @canvas.solver.update_variables(false)

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

    if @outline_props.do_stroke
      @outline_props.set_value(ctx)
      ctx.strokeRect.apply(ctx, frame_box)

    @_render_levels(ctx, ['image', 'underlay', 'glyph'], frame_box)
    @_render_levels(ctx, ['overlay', 'tool'])

    if title
      sx = @canvas.vx_to_sx(@canvas.get('width')/2)
      sy = @canvas.vy_to_sy(
        @model.title_panel.get('bottom') + @model.get('title_standoff'))
      @title_props.set_value(ctx)
      ctx.fillText(title, sx, sy)

    if not @initial_range_info?
      @set_initial_range()

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
    sortKey = (renderer) -> indices[renderer.id]

    for level in levels
      renderers = _.sortBy(_.values(@levels[level]), sortKey)
      for renderer in renderers
        renderer.render()

    ctx.restore()

  _map_hook: (ctx, frame_box) ->

  _paint_empty: (ctx, frame_box) ->
    ctx.fillStyle = @mget('border_fill')
    ctx.fillRect(0, 0,  @canvas_view.mget('canvas_width'),
                 @canvas_view.mget('canvas_height')) # TODO
    ctx.fillStyle = @mget('background_fill')
    ctx.fillRect.apply(ctx, frame_box)

class Plot extends HasParent
  type: 'Plot'
  default_view: PlotView

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
      solver: new Solver()
    })
    @set('canvas', canvas)

    @solver = canvas.get('solver')

    for r in @get('renderers')
      r.set('parent', @)

    @set('tool_manager', new ToolManager.Model({
      tools: @get('tools')
      toolbar_location: @get('toolbar_location')
      logo: @get('logo')
    }))

    logger.debug("Plot initialized")

  initialize_layout: (solver) ->
    canvas = @get('canvas')
    frame = new CartesianFrame.Model({
      x_range: @get('x_range'),
      extra_x_ranges: @get('extra_x_ranges'),
      x_mapper_type: @get('x_mapper_type'),
      y_range: @get('y_range'),
      extra_y_ranges: @get('extra_y_ranges'),
      y_mapper_type: @get('y_mapper_type'),
      solver: solver
    })
    @set('frame', frame)

    # TODO (bev) titles should probably be a proper guide, then they could go
    # on any side, this will do to get the PR merged
    @title_panel = new LayoutBox.Model({solver: solver})
    @title_panel._anchor = @title_panel._bottom
    elts = @get('above')
    elts.push(@title_panel)
    @set('above', elts)

  add_constraints: (solver) ->
    min_border_top    = @get('min_border_top')    ? @get('min_border')
    min_border_bottom = @get('min_border_bottom') ? @get('min_border')
    min_border_left   = @get('min_border_left')   ? @get('min_border')
    min_border_right  = @get('min_border_right')  ? @get('min_border')

    do_side = (solver, min_size, side, cnames, dim, op) =>
      canvas = @get('canvas')
      frame = @get('frame')
      box = new LayoutBox.Model({solver: solver})
      c0 = '_'+cnames[0]
      c1 = '_'+cnames[1]
      solver.add_constraint(
        new Constraint(new Expression(box['_'+dim], -min_size), Ge),
        kiwi.Strength.strong)
      solver.add_constraint(
        new Constraint(new Expression(frame[c0], [-1, box[c1]]),
        Eq))
      solver.add_constraint(
        new Constraint(new Expression(box[c0], [-1, canvas[c0]]),
        Eq))
      last = frame
      elts = @get(side)
      for r in elts
        if r.get('location') ? 'auto' == 'auto'
          r.set('location', side, {'silent' : true})
        if r.initialize_layout?
          r.initialize_layout(solver)
        solver.add_constraint(
          new Constraint(new Expression(last[c0], [-1, r[c1]]), Eq),
          kiwi.Strength.strong)
        last = r
      padding = new LayoutBox.Model({solver: solver})
      solver.add_constraint(
        new Constraint(new Expression(last[c0], [-1, padding[c1]]), Eq),
        kiwi.Strength.strong)
      solver.add_constraint(
        new Constraint(new Expression(padding[c0], [-1, canvas[c0]]), Eq),
        kiwi.Strength.strong)

    do_side(solver, min_border_top, 'above', ['top', 'bottom'], 'height', Le)
    do_side(solver, min_border_bottom, 'below', ['bottom', 'top'], 'height', Ge)
    do_side(solver, min_border_left, 'left', ['left', 'right'], 'width', Ge)
    do_side(solver, min_border_right, 'right', ['right', 'left'], 'width', Le)

  add_renderers: (new_renderers) ->
    renderers = @get('renderers')
    renderers = renderers.concat(new_renderers)
    @set('renderers', renderers)

  parent_properties: [
    'background_fill',
    'border_fill',
    'min_border',
    'min_border_top',
    'min_border_bottom'
    'min_border_left'
    'min_border_right'
  ]

  defaults: ->
    return _.extend {}, super(), {
      renderers: [],
      tools: [],
      h_symmetry: true,
      v_symmetry: false,
      x_mapper_type: 'auto',
      y_mapper_type: 'auto',
      plot_width: 600,
      plot_height: 600,
      title: '',
      above: [],
      below: [],
      left: [],
      right: [],
      toolbar_location: "above"
      logo: "normal"
      lod_factor: 10
      lod_interval: 300
      lod_threshold: 2000
      lod_timeout: 500
    }

  display_defaults: ->
    return _.extend {}, super(), {
      hidpi: true,
      background_fill: "#fff",
      border_fill: "#fff",
      min_border: 40,

      title_standoff: 8,
      title_text_font: "helvetica",
      title_text_font_size: "20pt",
      title_text_font_style: "normal",
      title_text_color: "#444444",
      title_text_alpha: 1.0,
      title_text_align: "center",
      title_text_baseline: "alphabetic"

      outline_line_color: '#aaaaaa'
      outline_line_width: 1
      outline_line_alpha: 1.0
      outline_line_join: 'miter'
      outline_line_cap: 'butt'
      outline_line_dash: []
      outline_line_dash_offset: 0
    }

module.exports =
  Model: Plot
  View: PlotView
