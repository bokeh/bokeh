
define [
  "underscore",
  "backbone",
  "kiwi",
  "./build_views",
  "./plot_utils",
  "./safebind",
  "./continuum_view",
  "./has_parent",
  "./canvas",
  "./solver",
  "./cartesian_frame",
  "./plot_template"
  "renderer/properties",
  "tool/active_tool_manager",
], (_, Backbone, kiwi, build_views, plot_utils, safebind, ContinuumView, HasParent, Canvas, Solver, CartesianFrame, plot_template, Properties, ActiveToolManager) ->

  line_properties = Properties.line_properties
  text_properties = Properties.text_properties

  Expr = kiwi.Expression
  Constraint = kiwi.Constraint
  EQ = kiwi.Operator.Eq
  LE = kiwi.Operator.Le
  GE = kiwi.Operator.Ge

  class PlotView extends ContinuumView.View
    className: "bokeh plotview"
    template: plot_template

    view_options: () ->
      _.extend({plot_model: @model, plot_view: @}, @options)

    pause: () ->
      @is_paused = true

    unpause: () ->
      @is_paused = false
      @request_render()

    request_render: () ->
      if not @is_paused
        @throttled_render()
      return

    initialize: (options) ->
      super(options)

      @canvas = @mget('canvas')
      @canvas_view = new @canvas.default_view({'model': @canvas})

      @listenTo(@model.solver, 'layout_update', @request_render)

      # compat, to be removed
      @frame = @mget('frame')
      @x_range = @frame.get('x_ranges')['default']
      @y_range = @frame.get('y_ranges')['default']
      @xmapper = @frame.get('x_mappers')['default']
      @ymapper = @frame.get('y_mappers')['default']

      template_data = {
        button_bar: @mget('button_bar')
      }
      html = @template(template_data)
      @$el.html(html)

      @$el.append(@canvas_view.$el)
      @canvas_view.render()

      @throttled_render = plot_utils.throttle_animation(@render, 15)

      @outline_props = new line_properties(@, {}, 'outline_')
      @title_props = new text_properties(@, {}, 'title_')

      @old_mapper_state = {
        x: null
        y: null
      }

      @renderers = {}
      @tools = {}

      @eventSink = _.extend({}, Backbone.Events)
      @atm = new ActiveToolManager(@eventSink)
      @levels = {}
      for level in plot_utils.LEVELS
        @levels[level] = {}
      @build_levels()
      @atm.bind_bokeh_events()
      @bind_bokeh_events()
      @model.add_layout()
      @request_render()
      return this

    map_to_screen: (x, x_units, y, y_units) ->
      @frame.map_to_screen(x, x_units, y, y_units, @canvas)

    map_from_screen: (sx, sy, units) ->
      @frame.map_from_screen(sx, sy, units, @canvas)

    update_range: (range_info) ->
      if not range_info?
        range_info = @initial_range_info
      @pause()
      @x_range.set(range_info.xr)
      @y_range.set(range_info.yr)
      @unpause()

    build_levels: () ->
      # need to separate renderer/tool creation from event binding
      # because things like box selection overlay needs to bind events
      # on the select tool
      #
      # should only bind events on NEW views and tools
      old_renderers = _.keys(@renderers)
      views = build_views(@renderers, @mget_obj('renderers'), @view_options())
      renderers_to_remove = _.difference(old_renderers, _.pluck(@mget_obj('renderers'), 'id'))
      for id_ in renderers_to_remove
        delete @levels.glyph[id_]
      tools = build_views(@tools, @mget_obj('tools'), @view_options())
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
      @listenTo(@mget('frame').get('x_range'), 'change', @request_render)
      @listenTo(@mget('frame').get('y_range'), 'change', @request_render)
      safebind(@, @model, 'change:renderers', @build_levels)
      safebind(@, @model, 'change:tool', @build_levels)
      safebind(@, @model, 'change', @request_render)
      safebind(@, @model, 'destroy', () => @remove())

    set_initial_range : () ->
      #check for good values for ranges before setting initial range
      range_vals = [@x_range.get('start'), @x_range.get('end'),
        @y_range.get('start'), @y_range.get('end')]
      good_vals = _.map(range_vals, (val) -> val? and not _.isNaN(val))
      good_vals = _.all(good_vals)
      if good_vals
        @initial_range_info = {
          xr: { start: @x_range.get('start'), end: @x_range.get('end') }
          yr: { start: @y_range.get('start'), end: @y_range.get('end') }
        }

    render: () ->
      super()

      @canvas_view.render()

      ctx = @canvas_view.ctx

      for k, v of @renderers
        if v.model.update_layout?
          v.model.update_layout(v, @model.solver)
      @model.solver.update_variables(false)

      if not @initial_range_info?
        @set_initial_range()

      title = @mget('title')
      if title
        @title_props.set(@canvas_view.ctx, {})
        th = ctx.measureText(@mget('title')).ascent

      frame_box = [
        @canvas.vx_to_sx(@frame.get('left')),
        @canvas.vy_to_sy(@frame.get('top')),
        @frame.get('width'),
        @frame.get('height'),
      ]

      @_map_hook()
      @_paint_empty(ctx, frame_box)

      if @outline_props.do_stroke
        @outline_props.set(ctx, {})
        ctx.strokeRect.apply(ctx, frame_box)

      have_new_mapper_state = false
      xms = @xmapper.get('mapper_state')[0]
      yms = @ymapper.get('mapper_state')[0]
      if Math.abs(@old_mapper_state.x-xms) > 1e-8 or Math.abs(@old_mapper_state.y - yms) > 1e-8
        @old_mapper_state.x = xms
        @old_mapper_state.y = yms
        have_new_mapper_state = true

      @_render_levels(ctx, ['image', 'underlay', 'glyph'], have_new_mapper_state, frame_box)
      @_render_levels(ctx, ['overlay', 'annotation', 'tool'], have_new_mapper_state)

      if title
        sx = @canvas.get('canvas_width')/2
        sy = th
        @title_props.set(ctx, {})
        ctx.fillText(title, sx, sy)

    _render_levels: (ctx, levels, have_new_mapper_state, clip_region) ->
      if clip_region?
        ctx.save()
        ctx.beginPath()
        ctx.rect.apply(ctx, clip_region)
        ctx.clip()
        ctx.beginPath()

      for level in levels
        renderers = @levels[level]
        for k, v of renderers
          v.render(have_new_mapper_state)

      if clip_region?
        ctx.restore()

    _map_hook: () ->

    _paint_empty: (ctx, frame_box) ->
      ctx.fillStyle = @mget('border_fill')
      ctx.fillRect(0, 0,  @canvas_view.mget('canvas_width'), @canvas_view.mget('canvas_height')) # TODO
      ctx.fillStyle = @mget('background_fill')
      ctx.fillRect.apply(ctx, frame_box)

  class Plot extends HasParent
    type: 'Plot'
    default_view: PlotView

    initialize: (attrs, options) ->
      super(attrs, options)

      @solver = new Solver()

      canvas = new Canvas.Model({
        map: options.map ? false,
        canvas_width: @get('plot_width'),
        canvas_height: @get('plot_height'),
        hidpi: @get('hidpi')
      }, {
        solver: @solver
      })
      @set('canvas', canvas)

    dinitialize: (attrs, options) ->
      super(attrs, options)

      canvas = @get('canvas')

      frame = new CartesianFrame.Model({
        x_range: @get_obj('x_range'), y_range: @get_obj('y_range')
      }, {
        solver: @solver
      })
      @set('frame', frame)

      min_border_top    = @get('min_border_top')    ? @get('min_border')
      min_border_bottom = @get('min_border_bottom') ? @get('min_border')
      min_border_left   = @get('min_border_left')   ? @get('min_border')
      min_border_right  = @get('min_border_right')  ? @get('min_border')

      @solver.add_constraint(new Constraint(new Expr(frame._left, -min_border_left), GE), kiwi.Strength.strong)
      @solver.add_constraint(new Constraint(new Expr(frame._right, min_border_right, [-1, canvas._right]), LE), kiwi.Strength.strong)
      @solver.add_constraint(new Constraint(new Expr(frame._bottom, -min_border_bottom), GE), kiwi.Strength.strong)
      @solver.add_constraint(new Constraint(new Expr(frame._top, min_border_top, [-1, canvas._top]), LE), kiwi.Strength.strong)
      @solver.update_variables()
      @solver.suggest_value(frame._width, canvas.get('width'))
      @solver.suggest_value(frame._height, canvas.get('height'))

      @solver.update_variables()

    add_layout: () ->

      do_side = (side, cname, op) =>
        canvas = @get('canvas')
        frame = @get('frame')
        last = frame
        elts = @get_obj(side)
        if elts.length == 0
          return
        for r in elts
          @solver.add_constraint(new Constraint(new Expr(last[cname], [-1, r._anchor]), EQ), kiwi.Strength.strong)
          last = r
        @solver.add_constraint(new Constraint(new Expr(last[cname], [-1, canvas[cname]]), op), kiwi.Strength.required)
        @solver.suggest_value(last["_width"] , 100)

      do_side('above', '_top', LE)
      do_side('below', '_bottom', GE)
      do_side('left', '_left', GE)
      do_side('right', '_right', LE)

      @solver.update_variables(false)

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

    defaults: () ->
      return {
        button_bar: true
        data_sources: {},
        renderers: [],
        tools: [],
        h_symmetry: true,
        v_symmetry: false,
        plot_width: 600,
        plot_height: 600,
        title: 'Plot',
        above: [],
        below: [],
        left: [],
        right: []
      }

    display_defaults: () ->
      return {
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

  class Plots extends Backbone.Collection
     model: Plot

  return {
    "Model": Plot,
    "Collection": new Plots(),
    "View": PlotView,
  }
