
define [
  "underscore"
  "backbone"
  "./build_views"
  "./continuum_view"
  "./collection"
  "./has_properties"
  "./tool_manager"
  "./plot_template"
  "renderer/properties"
], (_, Backbone, build_views, ContinuumView, Collection, HasProperties, ToolManager, plot_template, Properties) ->

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
      @register_property('height', () ->
          return _.reduce(@get('layout_heights'), ((x, y) -> x + y), 0)
        , false)
      @add_dependencies('height', @, 'layout_heights')
      @register_property('width', () ->
          return _.reduce(@get('layout_widths'), ((x, y) -> x + y), 0)
        , false)
      @add_dependencies('width', @, 'layout_widths')

    #compute a childs position in the underlying device
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
      @viewstate = new GridViewState();
      @child_views = {}
      @build_children()
      @bind_bokeh_events()
      @$el.html(@template())
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
          plot.set('toolbar_location', null)
          childmodels.push(plot)
      build_views(@child_views, childmodels, {})

      viewstates = []
      for row in @mget('children')
        vsrow = (@child_views[x.id].canvas for x in row)
        viewstates.push(vsrow)
      @viewstate.set('viewstates', viewstates)

      for row in @mget('children')
        for plot in row
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
        for plotspec, cidx in row
          view = @child_views[plotspec.id]
          ypos = @viewstate.position_child_y(y_coords[ridx], view.canvas.get('height'))
          xpos = @viewstate.position_child_x(x_coords[cidx], view.canvas.get('width'))
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

      @set('tool_manager', new ToolManager.Model({
        tools: []
        toolbar_location: @get('toolbar_location')
      }))

    defaults: ->
      return _.extend {}, super(), {
        children: [[]]
        toolbar_location: "left"
      }

  class GridPlots extends Collection
    model: GridPlot

  return {
    "Model": GridPlot,
    "Collection": new GridPlots(),
    "View": GridPlotView,
  }
