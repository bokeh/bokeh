$ = require "jquery"
_ = require "underscore"
Backbone = require "backbone"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
LayoutDOM = require "./layout_dom"
HasProps = require "../../core/has_props"
{logger} = require "../../core/logging"
ToolManager = require "../../common/tool_manager"
plot_template = require "../plots/plot_template"
p = require "../../core/properties"

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

  Object.defineProperty this.prototype, "event_type", {
    get: () -> @attributes.tools[0].event_type
  }

  get: (attr) ->
    return @attributes.tools[0].get(attr)

  set: (attr, value) ->
    super(attr, value)
    attr = _.omit(attr, "tools")
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
      info.tools = _.sortBy(tools, (tool) -> tool.default_order)
      if et not in ['pinch', 'scroll']
        info.tools[0].set('active', true)

  _active_change: (tool) =>
    event_type = tool.event_type
    gestures = @get('gestures')

    # Toggle between tools of the same type by deactivating any active ones
    currently_active_tool = gestures[event_type].active
    if currently_active_tool? and currently_active_tool != tool
      logger.debug("GridToolManager: deactivating tool: #{currently_active_tool.type} (#{currently_active_tool.id}) for event type '#{event_type}'")
      currently_active_tool.set('active', false)

    # Update the gestures with the new active tool
    gestures[event_type].active = tool
    @set('gestures', gestures)
    logger.debug("GridToolManager: activating tool: #{tool.type} (#{tool.id}) for event type '#{event_type}'")
    return null

  @internal {
    tool_managers: [ p.Array, [] ]
    toolbar_location: [ p.Location ]
    num_plots: [ p.Int ]
  }

class GridViewState extends HasProps

  setup_layout_properties: () =>
    @override_computed_property('layout_heights', @layout_heights, false)
    @override_computed_property('layout_widths', @layout_widths, false)
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
    @define_computed_property('height', calculateHeight, false)
    @add_dependencies('height', @, 'layout_heights')

    calculateWidth = =>
      _.reduce @get("layout_widths"), ((x, y) -> x + y), 0
    @define_computed_property('width', calculateWidth, false)
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

  @internal {
    viewstates: [ p.Array, [[]] ]
    border_space: [ p.Number, 0 ]
  }

class GridPlotView extends BokehView
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
        location: toolbar_location
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
        @listenTo(@model.document.solver(), 'layout_update', @render)

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
        location: toolbar_location
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

class GridPlot extends LayoutDOM.Model
  type: 'GridPlot'
  default_view: GridPlotView

  constructor: () ->
    # new GridPlot({children: [...]}) or GridPlot([...])
    if this instanceof GridPlot
      return super(arguments...)
    else
      [children] = arguments
      return new GridPlot({children: children})

  initialize: (attrs, options) ->
    super(attrs, options)
    children = []
    for plot in _.flatten(@get('children'))
      if plot?
        children.push(plot)
    @set('flat_children', children)
    @define_computed_property('tool_manager', () ->
      new GridToolManager({
        tool_managers: (plot.get('tool_manager') for plot in @get('flat_children'))
        toolbar_location: @get('toolbar_location')
        num_plots: @get('flat_children').length
      })
    , true)

  @define {
    children:          [ p.Array, [[]]      ]
    border_space:      [ p.Number, 0        ]
    toolbar_location:  [ p.Location, 'left' ]
  }

  @internal {
    flat_children:     [ p.Array, [] ]
  }

  get_layoutable_children: () ->
    return @get('flat_children')

  get_edit_variables: () ->
    edit_variables = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())
    return constraints

module.exports =
  Model: GridPlot
  View: GridPlotView
