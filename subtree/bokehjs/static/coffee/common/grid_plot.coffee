base = require("../base")
HasParent = base.HasParent
HasProperties = base.HasProperties
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView

PlotViewState = require('./plot').PlotViewState

class GridPlotView extends ContinuumView
  tagName: 'div'
  className: "grid_plot"
  default_options: {scale:1.0}
  set_child_view_states: () ->
    viewstates = []
    for row in @mget('children')
      viewstaterow = (@childviews[x.id].viewstate for x in row)
      viewstates.push(viewstaterow)
    @viewstate.set('childviewstates', viewstates)

  initialize: (options) ->
    super(_.defaults(options, @default_options))
    @viewstate = new GridViewState();
    @childviews = {}
    @build_children()
    @bind_bokeh_events()
    @render()
    return this

  bind_bokeh_events: () ->
    safebind(this, @model, 'change:children', @build_children)
    safebind(this, @model, 'change', @render)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())

  #FIXME make binding of this style equivalent to above safebind calls
  # document semantics of when these events should be bound
  #bokeh events
  b_events: {
    "change:children model": "build_children",
    "change model":           "render",
    "change viewstate"     : "render",
    "destroy model"        : "remove"}

  build_children: () ->
    childmodels = []
    for row in @mget_obj('children')
      for plot in row
        childmodels.push(plot)
    build_views(@childviews, childmodels, {})
    @set_child_view_states()

  render: () ->
    super()
    for view in _.values(@childviews)
      view.$el.detach()
    @$el.html('')
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
      for plotspec, cidx in row
        view = @childviews[plotspec.id]
        ypos = @viewstate.position_child_y(view.viewstate.get('outerheight'),
          y_coords[ridx])
        xpos = @viewstate.position_child_x(view.viewstate.get('outerwidth'),
          x_coords[cidx])
        plot_wrapper = $("<div class='gp_plotwrapper'></div>")
        plot_wrapper.attr(
          'style',
          "left:#{xpos}px; top:#{ypos}px")
        plot_wrapper.append(view.$el)
        @$el.append(plot_wrapper)
    height = @viewstate.get('outerheight')
    width = @viewstate.get('outerwidth')
    @$el.attr('style', "height:#{height}px;width:#{width}px")
    @render_end()

class GridPlot extends HasParent
  type: 'GridPlot'
  default_view: GridPlotView

GridPlot::defaults = _.clone(GridPlot::defaults)
_.extend(GridPlot::defaults, {
  children: [[]]
  border_space: 0
})


class GridPlots extends Backbone.Collection
  model: GridPlot


class GridPlotViewState extends PlotViewState
  setup_layout_properties: () =>
    @register_property('layout_heights', @layout_heights, true)
    @register_property('layout_widths', @layout_widths, true)
    for row in @get('childviewstates')
      for viewstate in row
        @add_dependencies('layout_heights', viewstate, 'outerheight')
        @add_dependencies('layout_widths', viewstate, 'outerwidth')

  initialize: (attrs, options) ->
    super(attrs, options)
    @setup_layout_properties()
    safebind(this, this, 'change:childviewstates', @setup_layout_properties)
    @register_property('height', () ->
        return _.reduce(@get('layout_heights'), ((x, y) -> x + y), 0)
      , true)
    @add_dependencies('height', @, 'layout_heights')
    @register_property('width', () ->
        return _.reduce(@get('layout_widths'), ((x, y) -> x + y), 0)
      , true)
    @add_dependencies('width', @, 'layout_widths')

  #compute a childs position in the underlying device
  position_child_x: (childsize, offset) ->
    return  @xpos(offset)
  position_child_y: (childsize, offset) ->
    return @ypos(offset) - childsize

  maxdim: (dim, row) ->
    if row.length == 0
      return 0
    else
      return _.max(_.map(row, ((x) -> return x.get(dim))))

  layout_heights: () =>
    row_heights=(@maxdim('outerheight',row) for row in @get('childviewstates'))
    return row_heights

  layout_widths: () =>
    num_cols = @get('childviewstates')[0].length
    columns = ((row[n] for row in @get('childviewstates')) for n in _.range(num_cols))
    col_widths = (@maxdim('outerwidth', col) for col in columns)
    return col_widths

GridPlotViewState::defaults = _.clone(GridPlotViewState::defaults)
_.extend(GridPlotViewState::defaults
  ,
    childviewstates: [[]]
    border_space: 0
)


exports.GridPlot = GridPlot
exports.GridPlotView = GridPlotView
exports.GridPlotViewState = GridPlotViewState
exports.gridplots = new GridPlots
