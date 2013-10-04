base = require("../base")
HasParent = base.HasParent
HasProperties = base.HasProperties
safebind = base.safebind
build_views = base.build_views

ContinuumView = require('./continuum_view').ContinuumView

ViewState = require('./view_state').ViewState
GridViewState = require('./grid_view_state').GridViewState
ActiveToolManager = require("../tools/active_tool_manager").ActiveToolManager
PanToolView = require('../tools/pan_tool').PanToolView
ZoomToolView = require('../tools/zoom_tool').ZoomToolView

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

  
  startPan : ->
    
    all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values))
    pan_tools = _.where(all_tools, {constructor:PanToolView})
    _.each(pan_tools, (t) ->
      t_name = t.evgen.toolName
      console.log('activating ', t_name)
      t.evgen.eventSink.trigger('active_tool', t_name))

  makeButton : (eventSink, constructor, toolbar_div, button_name) ->
    
    all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values))
    specific_tools = _.where(all_tools, {constructor:constructor})
    button = $("<button>#{button_name}</button>")
    toolbar_div.append(button)
    tool_active = false;
    button_activated = false;
    button.click(->
      console.log("button clicked", button_name);
      #debugger;
      if button_activated
        eventSink.trigger('clear_active_tool')
      else
        eventSink.trigger('active_tool', button_name))

    eventSink.on("#{button_name}:deactivated", ->
      button.removeClass('active')
      button_activated = false
      _.each(specific_tools, (t) ->
        t_name = t.evgen.toolName
        console.log('deactivating ', t_name)

        t.evgen.eventSink.trigger("#{t_name}:deactivated")))

    eventSink.on("#{button_name}:activated", ->
      button.addClass('active')
      button_activated = true
      _.each(specific_tools, (t) ->
        t_name = t.evgen.toolName
        console.log('activating ', t_name)
        t.evgen.eventSink.trigger("#{t_name}:activated")))

    
    
    
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
    @button_bar = $("<div class='grid_button_bar'/>")
    @button_bar.attr('style',     "position:absolute; left:100px;  border:2px solid green")

    @toolEventSink = _.extend({}, Backbone.Events)
    @atm = new ActiveToolManager(@toolEventSink)
    @atm.bind_bokeh_events()
    @$el.append(@button_bar)
    @makeButton(@toolEventSink, PanToolView, @button_bar, "pan")
    @makeButton(@toolEventSink, ZoomToolView, @button_bar, "zoom")


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
