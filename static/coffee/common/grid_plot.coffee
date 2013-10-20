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
  className: "bokeh grid_plot"
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
    @toolbar_height = 0 # if there are any buttons, this will be set in add toolbar
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

  makeButton : (eventSink, constructor, toolbar_div, button_name) ->

    all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values))
    specific_tools = _.where(all_tools, {constructor:constructor})
    button = $("<button class='btn btn-small'>#{button_name}</button>")
    toolbar_div.append(button)
    tool_active = false;
    button_activated = false;
    button.click(->
      console.log("button clicked", button_name);
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

  addGridToolbar : ->

    @button_bar = $("<div class='grid_button_bar'/>")
    @button_bar.attr('style',     "position:absolute; left:10px; top:5px; ")
    @toolEventSink = _.extend({}, Backbone.Events)
    @atm = new ActiveToolManager(@toolEventSink)
    @atm.bind_bokeh_events()
    @$el.append(@button_bar)
    all_tools = _.flatten(_.map(_.pluck(this.childviews, 'tools'), _.values))
    all_tool_classes = _.uniq(_.pluck(all_tools, 'constructor'))
    if all_tool_classes.length > 0
      @toolbar_height = 20 # make room for the button bar
    tool_name_dict = {}
    _.each(all_tool_classes, (klass) ->
      btext = _.where(all_tools, {constructor:klass})[0].evgen_options.buttonText
      tool_name_dict[btext] = klass)
    _.map(tool_name_dict, (klass, button_text) =>
      @makeButton(@toolEventSink, klass, @button_bar, button_text))
    _.map(all_tools, (t) ->
      console.log(t)
      console.log(t.evgen)
      t.evgen.hide_button())

    
  render: () ->
    super()
    for view in _.values(@childviews)
      view.$el.detach()
    @$el.html('')
    @addGridToolbar()
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
        ypos = @viewstate.position_child_y(y_coords[ridx],
          view.view_state.get('outer_height') - @toolbar_height)

        xpos = @viewstate.position_child_x(x_coords[cidx], view.view_state.get('outer_width'))
        plot_wrapper = $("<div class='gp_plotwrapper'></div>")
        plot_wrapper.attr(
          'style',
          "position: absolute; left:#{xpos}px; top:#{ypos}px")
        plot_wrapper.append(view.$el)
        @$el.append(plot_wrapper)

    add = (a,b) -> a+b
    total_height = _.reduce(row_heights, add, 0)
    #height = @viewstate.get('outerheight', total_height)
    height = total_height + @toolbar_height
    width = @viewstate.get('outerwidth')
    @$el.attr('style', "position:relative; height:#{height}px;width:#{width}px")


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
