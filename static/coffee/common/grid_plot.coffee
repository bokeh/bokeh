base = require("../base")
HasParent = base.HasParent
HasProperties = base.HasProperties
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView

ViewState = require('./view_state').ViewState
GridViewState = require('./grid_view_state').GridViewState

class GridPlotView extends ContinuumView
  tagName: 'div'
  className: "grid_plot"
  default_options: {scale:1.0}
  set_child_view_states: () ->
    viewstates = []
    for row in @mget('children')
      viewstaterow = (@childviews[x.id].view_state for x in row)
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
        ypos = @viewstate.position_child_y(y_coords[ridx], view.view_state.get('outer_height'))
        xpos = @viewstate.position_child_x(x_coords[cidx], view.view_state.get('outer_width'))
        plot_wrapper = $("<div class='gp_plotwrapper'></div>")
        plot_wrapper.attr(
          'style',
          "position: absolute; left:#{xpos}px; top:#{ypos}px")
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


exports.GridPlot = GridPlot
exports.GridPlotView = GridPlotView
exports.gridplots = new GridPlots
