$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
build_views = require "./build_views"
ContinuumView = require "./continuum_view"
HasProperties = require "./has_properties"
{logger} = require "./logging"
ToolManager = require "./tool_manager"
plot_template = require "./plot_template"

class ToolProxy extends Backbone.Model

  initialize: (options) ->
    super(options)
    # OK this is pretty lame but should work until we make a new
    # better grid plot. This just mimics all the events that
    # any of the tool types might expect to get.
    @listenTo(@, 'do', @do)
    @listenTo(@, 'change:active', @active)
    return null

  do: () ->
    for tool in @attributes.tools
      tool.trigger('do')
    return null

  active: () ->
    for tool in @attributes.tools
      tool.set('active', @attributes.active)
    return null

  attrs_and_props: () ->
    return @attributes.tools[0].attrs_and_props()

  get: (attr) ->
    return @attributes.tools[0].get(attr)

  set: (attr, value) ->
    super(attr, value)
    for tool in @attributes.tools
      tool.set(attr, value)
    return null

class GridToolManager extends ToolManager.Model

  _init_tools: () ->
    # Note: no call to super(), intentionally

    inspectors = {}
    actions = {}
    gestures = {}

    for tm in @get('tool_managers')

      for et, info of tm.get('gestures')
        if et not of gestures
          gestures[et] = {}
        for tool in info.tools
          if tool.type not of gestures[et]
            gestures[et][tool.type] = []
          gestures[et][tool.type].push(tool)

      for tool in tm.get('inspectors')
        if tool.type not of inspectors
          inspectors[tool.type] = []
        inspectors[tool.type].push(tool)

      for tool in tm.get('actions')
        if tool.type not of actions
          actions[tool.type] = []
        actions[tool.type].push(tool)

    for et of gestures
      for typ, tools of gestures[et]
        if tools.length != @get('num_plots')
          continue
        proxy = new ToolProxy({tools: tools})
        @get('gestures')[et].tools.push(proxy)
        @listenTo(proxy, 'change:active', _.bind(@_active_change, proxy))

    for typ, tools of actions
      if tools.length != @get('num_plots')
        continue
      proxy = new ToolProxy({tools: tools})
      tmp = @get('actions')
      tmp.push(proxy)
      @set('actions', tmp)

    for typ, tools of inspectors
      if tools.length != @get('num_plots')
        continue
      proxy = new ToolProxy({tools: tools})
      tmp = @get('inspectors')
      tmp.push(proxy)
      @set('inspectors', tmp)

    for et, info of @get('gestures')
      tools = info.tools
      if tools.length == 0
        continue
      info.tools = _.sortBy(tools, (tool) -> tool.get('default_order'))
      info.tools[0].set('active', true)

  _active_change: (tool) =>
    et = tool.get('event_type')

    active = tool.get('active')
    if not active
      return null

    gestures = @get('gestures')
    prev = gestures[et].active
    if prev?
      logger.debug(
        "GridToolManager: deactivating tool: #{prev.type} (for event type '#{et}'"
      )
      prev.set('active', false)

    gestures[et].active = tool
    @set('gestures', gestures)
    logger.debug(
      "GridToolManager: activating tool: #{tool.type} (for event type '#{et}'"
    )
    return null

  defaults: () ->
    return _.extend {}, super(), {
      tool_manangers: []
    }

class GridViewState extends HasProperties

  setup_layout_properties: () =>
    @register_property('layout_heights', @layout_heights, false)
    @register_property('layout_widths', @layout_widths, false)
    for row in @get('viewstates')
      for viewstate in row
        @add_dependencies('layout_heights', viewstate, 'height')
        @add_dependencies('layout_widths', viewstate, 'width')

  initialize: (attrs, options) ->
    super(attrs, options)
    @setup_layout_properties()
    @listenTo(this, 'change:viewstates', @setup_layout_properties)
    calculateHeight = =>
      _.reduce @get("layout_heights"), ((x, y) -> x + y), 0
    @register_property('height', calculateHeight, false)
    @add_dependencies('height', @, 'layout_heights')

    calculateWidth = =>
      _.reduce @get("layout_widths"), ((x, y) -> x + y), 0
    @register_property('width', calculateWidth, false)
    @add_dependencies('width', @, 'layout_widths')

  position_child_x: (offset, childsize) ->
    return offset

  position_child_y: (offset, childsize) ->
    return @get('height') - offset - childsize

  maxdim: (dim, row) ->
    if row.length == 0
      return 0
    else
      return _.max(_.map(row, (x) ->
        if x?
          return x.get(dim)
        return 0
      ))

  layout_heights: () =>
    row_heights = (@maxdim('height',row) for row in @get('viewstates'))
    return row_heights

  layout_widths: () =>
    num_cols = @get('viewstates')[0].length
    columns = ((row[n] for row in @get('viewstates')) for n in _.range(num_cols))
    col_widths = (@maxdim('width', col) for col in columns)
    return col_widths

  defaults: ->
    return _.extend {}, super(), {
      viewstates: [[]]
      border_space: 0
    }

class GridPlotView extends ContinuumView
  className: ""
  template: plot_template

  initialize: (options) ->
    super(options)
    @viewstate = new GridViewState()
    @child_views = {}
    @build_children()
    @bind_bokeh_events()
    @$el.html(@template())
    toolbar_location = @mget('toolbar_location')
    if toolbar_location?
      toolbar_selector = '.bk-plot-' + toolbar_location
      logger.debug(
        "attaching toolbar to #{toolbar_selector} for plot #{@model.id}"
      )
      @tm_view = new ToolManager.View({
        model: @mget('tool_manager')
        el: @$(toolbar_selector)
      })
    @render()
    return this

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:children', @build_children)
    @listenTo(@model, 'change', @render)
    @listenTo(@viewstate, 'change', @render)
    @listenTo(@model, 'destroy', @remove)

  build_children: () ->
    childmodels = []
    for row in @mget('children')
      for plot in row
        if not plot?
          continue
        plot.set('toolbar_location', null)
        childmodels.push(plot)
    build_views(@child_views, childmodels, {})

    viewstates = []
    for row in @mget('children')
      vsrow = []
      for plot in row
        if not plot?
          continue
        vsrow.push(@child_views[plot.id].canvas)
      viewstates.push(vsrow)
    @viewstate.set('viewstates', viewstates)

    for row in @mget('children')
      for plot in row
        if not plot?
          continue
        @listenTo(plot.solver, 'layout_update', @render)

  render: () ->
    super()

    for view in _.values(@child_views)
      view.$el.detach()

    div = $('<div />')
    @$('.bk-plot-canvas-wrapper').empty()
    @$('.bk-plot-canvas-wrapper').append(div)

    toolbar_location = @mget('toolbar_location')
    if toolbar_location?
      toolbar_selector = '.bk-plot-' + toolbar_location
      @tm_view = new ToolManager.View({
        model: @mget('tool_manager')
        el: @$(toolbar_selector)
      })
      @tm_view.render()

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
      for plot, cidx in row
        if not plot?
          continue
        view = @child_views[plot.id]
        ypos = @viewstate.position_child_y(y_coords[ridx],
          view.canvas.get('height'))
        xpos = @viewstate.position_child_x(x_coords[cidx],
          view.canvas.get('width'))
        plot_wrapper = $("<div class='gp_plotwrapper'></div>")
        plot_wrapper.attr(
          'style',
          "position: absolute; left:#{xpos}px; top:#{ypos}px")
        plot_wrapper.append(view.$el)
        div.append(plot_wrapper)

    add = (a,b) -> a+b
    total_height = _.reduce(row_heights, add, 0)
    height = total_height
    width = _.reduce(col_widths, add, 0)
    div.attr('style', "position:relative; height:#{height}px;width:#{width}px")

class GridPlot extends HasProperties
  type: 'GridPlot'
  default_view: GridPlotView

  initialize: (attrs, options) ->
    super(attrs, options)
    @register_property('tool_manager', () ->
      children = []
      for plot in _.flatten(@get('children'))
        if plot?
          children.push(plot)
      new GridToolManager({
        tool_managers: (plot.get('tool_manager') for plot in children)
        toolbar_location: @get('toolbar_location')
        num_plots: children.length
      })
    , true)

  defaults: () ->
    return _.extend {}, super(), {
      children: [[]]
      toolbar_location: "left"
    }

module.exports =
  Model: GridPlot
  View: GridPlotView
