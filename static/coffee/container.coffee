base = require("./base")
HasParent = base.HasParent
HasProperties = base.HasProperties
ContinuumView = base.ContinuumView
safebind = base.safebind
build_views = base.build_views

tools = require("./tools")
ActiveToolManager = tools.ActiveToolManager

class PlotContextView extends ContinuumView
  initialize : (options) ->
    @views = {}
    @views_rendered = [false]
    @child_models = []
    super(options)
    @render()

  delegateEvents: ->
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    super()

  generate_remove_child_callback : (view) ->
    callback = () =>
      return null
    return callback

  build_children : () ->
    created_views = build_views(
      @views, @mget_obj('children'), {})

    window.pc_created_views = created_views
    window.pc_views = @views
    return null

  events :
    #'click .jsp' : 'newtab'
    'click .plotclose' : 'removeplot'
    'click .closeall' : 'closeall'
    'keydown .plottitle' : 'savetitle'
  size_textarea : (textarea) ->
    scrollHeight = $(textarea).height(0).prop('scrollHeight')
    $(textarea).height(scrollHeight)

  savetitle : (e) =>
    if e.keyCode == 13 #enter
      e.preventDefault()
      plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
      s_pc = @model.resolve_ref(@mget('children')[plotnum])
      s_pc.set('title', $(e.currentTarget).val())
      s_pc.save()
      $(e.currentTarget).blur()
      return false
    @size_textarea($(e.currentTarget))

  closeall : (e) =>
    @mset('children', [])
    @model.save()

  removeplot : (e) =>
    plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
    s_pc = @model.resolve_ref(@mget('children')[plotnum])
    view = @views[s_pc.get('id')]
    view.remove();
    newchildren = (x for x in @mget('children') when x.id != view.model.id)
    @mset('children', newchildren)
    @model.save()
    return false

  render : () ->
    super()
    @build_children()
    for own key, val of @views
      val.$el.detach()
    @$el.html('')
    @$el.append("<div><a class='closeall' href='#'>Close All Plots</a></div>")
    @$el.append("<br/>")
    to_render = []
    tab_names = {}
    for modelref, index in @mget('children')
      view = @views[modelref.id]
      node = $("<div class='jsp' data-plot_num='#{index}'></div>"  )
      @$el.append(node)
      title = view.model.get('title')
      node.append($("<textarea class='plottitle'>#{title}</textarea>"))
      node.append($("<a class='plotclose'>[close]</a>"))
      node.append(view.el)
    _.defer(() =>
      for textarea in @$el.find('.plottitle')
        @size_textarea($(textarea))
    )
    return null

class PlotContextViewState extends HasProperties
  defaults :
    maxheight : 600
    maxwidth : 600
    selected : 0

class PlotContextViewWithMaximized extends PlotContextView
  initialize : (options) ->
    @selected = 0
    @viewstate = new PlotContextViewState(
      maxheight : options.maxheight
      maxwidth : options.maxwidth
    )
    super(options)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'change:children', () =>
      selected = @viewstate.get('selected')
      if selected > @model.get('children') - 1
        @viewstate.set('selected', 0)
    )
  events :
    'click .maximize' : 'maximize'
    'click .plotclose' : 'removeplot'
    'click .closeall' : 'closeall'
    'keydown .plottitle' : 'savetitle'

  maximize : (e) ->
    plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
    @viewstate.set('selected', plotnum)

  render : () ->
    super()
    @build_children()
    for own key, val of @views
      val.$el.detach()
    @$el.html('')
    main = $("<div class='plotsidebar'><div>")
    @$el.append(main)
    @$el.append("<div class='maxplot'>")
    main.append("<div><a class='closeall' href='#'>Close All Plots</a></div>")
    main.append("<br/>")
    to_render = []
    tab_names = {}
    for modelref, index in @mget('children')
      view = @views[modelref.id]
      node = $("<div class='jsp' data-plot_num='#{index}'></div>"  )
      main.append(node)
      title = view.model.get('title')
      node.append($("<textarea class='plottitle'>#{title}</textarea>"))
      node.append($("<a class='maximize'>[max]</a>"))
      node.append($("<a class='plotclose'>[close]</a>"))
      node.append(view.el)
    if @mget('children').length > 0
      modelref = @mget('children')[@viewstate.get('selected')]
      model = @model.resolve_ref(modelref)
      @maxview = new model.default_view(
        model : model
      )
      @$el.find('.maxplot').append(@maxview.$el)
    else
      @maxview = null

    _.defer(() =>
      for textarea in main.find('.plottitle')
        @size_textarea($(textarea))
      if @maxview
        width = model.get('width')
        height = model.get('height')
        maxwidth = @viewstate.get('maxwidth')
        maxheight = @viewstate.get('maxheight')
        widthratio = maxwidth/width
        heightratio = maxheight/height
        ratio = _.min([widthratio, heightratio])
        newwidth = ratio * width
        newheight = ratio * height
        @maxview.viewstate.set('height', newheight)
        @maxview.viewstate.set('width', newwidth)

    )
    return null


#we should take this out, don't need plot context for single plot
class SinglePlotContextView extends ContinuumView
  initialize : (options) ->
    @views = {}
    @views_rendered = [false]
    @child_models = []
    @target_model_id = options.target_model_id
    super(options)
    @render()

  delegateEvents: ->
    safebind(this, @model, 'destroy', @remove)
    safebind(this, @model, 'change', @render)
    super()

  generate_remove_child_callback : (view) ->
    callback = () =>
      return null
    return callback

  single_plot_children : () ->
    return _.filter(@mget_obj('children'), (child) => child.id == @target_model_id)

  build_children : () ->
    created_views = build_views(@views, @single_plot_children(), {})
    window.pc_created_views = created_views
    window.pc_views = @views
    return null

  events :
    #'click .jsp' : 'newtab'
    'click .plotclose' : 'removeplot'

  removeplot : (e) =>
    plotnum = parseInt($(e.currentTarget).parent().attr('data-plot_num'))
    s_pc = @model.resolve_ref(@mget('children')[plotnum])
    view = @views[s_pc.get('id')]
    view.remove();
    newchildren = (x for x in @mget('children') when x.id != view.model.id)
    @mset('children', newchildren)
    @model.save()
    return false

  render : () ->
    super()
    @build_children()
    for own key, val of @views
      val.$el.detach()
    @$el.html('')
    to_render = []
    tab_names = {}
    for modelref, index in @single_plot_children()
      console.log("modelref.id ", modelref.id)
      view = @views[modelref.id]
      node = $("<div class='jsp' data-plot_num='#{index}'></div>"  )
      @$el.append(node)
      title = view.model.get('title')
      node.append($("<p>#{title}</p>"))
      node.append(view.el)
    return null


class PlotView extends ContinuumView
  default_options : {scale:1.0}

  view_options : ->
    _.extend({plot_model : @model, plot_view : @}, @options)

  build_renderers : ->
    build_views(@renderers, @mget_obj('renderers'), @view_options())

  build_axes : ->
    build_views(@axes, @mget_obj('axes'), @view_options())

  build_tools : ->
    #build_views(@model, @tools, @mget('tools'), @model_specs())
    build_views(@tools, @mget_obj('tools'), @view_options())

  build_overlays : ->
    #add ids of renderer views into the overlay spec
    build_views(@overlays, @mget_obj('overlays'), @view_options())

  bind_overlays : ->
    for overlayspec in @mget('overlays')
      @overlays[overlayspec.id].bind_events(this)

  bind_tools : ->
    for toolspec in   @mget('tools')
      @tools[toolspec.id].bind_events(this)

  tagName : 'div'

  events :
    "mousemove .main_can_wrapper" : "_mousemove"
    "mousedown .main_can_wrapper" : "_mousedown"

  _mousedown : (e) ->
    for f in @mousedownCallbacks
      f(e, e.layerX, e.layerY)

  _mousemove : (e) ->
    for f in @moveCallbacks
      f(e, e.layerX, e.layerY)


  initialize : (options) ->
    @throttled = _.throttle(@render_deferred_components, 50)
    super(_.defaults(options, @default_options))
    height = if options.height then options.height else @mget('height')
    width = if options.width then options.width else @mget('width')
    offset = if options.offset then options.offset else @mget('offset')
    if options.border_space
      border_space = options.border_space
    else
      border_space = @mget('border_space')
    @viewstate = new ViewState(
      height : height
      width : width
      offset : offset
      border_space : border_space
    )
    @renderers = {}
    @axes = {}
    @tools = {}
    @overlays = {}
    @eventSink = _.extend({}, Backbone.Events)
    atm = new ActiveToolManager(@eventSink)
    @moveCallbacks = []
    @mousedownCallbacks = []
    @keydownCallbacks = []
    @render_init()
    @render()
    @build_subviews()
    return this

  render_init : () ->
    #FIXME template
    @$el.append($("""
      <div class='button_bar'/>
      <div class='all_can_wrapper'>

        <div class='main_can_wrapper can_wrapper'>
          <div class='_shader' />
          <canvas class='main_can'></canvas>
        </div>
        <div class='x_can_wrapper can_wrapper'>
            <canvas class='x_can'></canvas>
        </div>
        <div class='y_can_wrapper can_wrapper'>
          <canvas class='y_can'></canvas>
        </div>
      </div>
      """))
    @$el.addClass("plot_wrap")
    @canvas = @$el.find('canvas.main_can')
    @x_can = @$el.find('canvas.x_can')[0]
    @y_can = @$el.find('canvas.y_can')[0]
    @main_can_wrapper = @$el.find('.main_can_wrapper')
    @x_can_wrapper = @$el.find('.x_can_wrapper')
    @y_can_wrapper = @$el.find('.y_can_wrapper')

  build_subviews : ()->
    @build_renderers()
    @build_axes()
    @build_tools()
    @build_overlays()
    @bind_tools()
    @bind_overlays()


  bind_bokeh_events : () ->
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'change:renderers', @build_renderers)
    safebind(this, @model, 'change:axes', @build_axes)
    safebind(this, @model, 'change:tools', @build_tools)
    safebind(this, @model, 'change', @render)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())


  # FIXME document throughly when render is called vs render_deferred
  # should we have a "render_init" "render" and a
  # "render_canvas" function add_dom is called at instatiation.
  # "render" is called for plot resizing.  render_canvas is called
  # when changes to the canvas are desired.  A ScatterRendererView
  # would only have a "render_canvas function

  render : () ->
    height = @viewstate.get('height')
    width = @viewstate.get('width')
    border_space = @viewstate.get('border_space')
    outerheight = @viewstate.get('outerheight')
    outerwidth = @viewstate.get('outerwidth')
    super()
    @$el.attr("width", outerwidth)
      .attr('height', outerheight)
    bord = border_space
    xcw = @x_can_wrapper
    w = width
    h = height

    o_w = outerwidth
    o_h = outerheight
    @main_can_wrapper.attr('style', "left:#{bord}px; height:#{h}px; width:#{w}px")
    @x_can_wrapper.attr('style', "left:#{bord}px; top:#{h}px; height:#{bord}px; width:#{w}px")
    @y_can_wrapper.attr('style', "width:#{bord}px; height:#{h}px;")


    @$el.attr("style", "height:#{o_h}px; width:#{o_w}px")
    wh = (el, w, h) ->
      $(el).attr('width', w)
      $(el).attr('height',h)
    wh(@canvas, w, h)
    wh(@x_can, w, bord)
    wh(@y_can, bord, h)

    @x_can_ctx = @x_can.getContext('2d')
    @y_can_ctx = @y_can.getContext('2d')
    @ctx = @canvas[0].getContext('2d')
    @render_end()

  render_deferred_components: (force) ->
    #console.log("plotview render deferred components", @constructor, new Date() - 1)
    all_views = _.flatten(_.map([@tools, @axes, @renderers, @overlays], _.values))
    @ctx.clearRect(0,0,  @viewstate.get('width'), @viewstate.get('height'))
    for v in all_views
      v.render()


class GridPlotContainerView extends ContinuumView
  tagName : 'div'
  className:"gridplot_container"
  default_options : { scale:1.0}
  set_child_view_states : () ->
    viewstates = []
    for row in @mget('children')
      viewstaterow = (@childviews[x.id].viewstate for x in row)
      viewstates.push(viewstaterow)
    @viewstate.set('childviewstates', viewstates)

  initialize : (options) ->
    super(_.defaults(options, @default_options))
    @viewstate = new GridViewState();
    @childviews = {}
    @build_children()
    @render()
    return this

  bind_bokeh_events : ->
    safebind(this, @model, 'change:children', @build_children)
    safebind(this, @model, 'change', @render)
    safebind(this, @viewstate, 'change', @render)
    safebind(this, @model, 'destroy', () => @remove())

  #FIXME make binding of this style equivalent to above safebind calls
  # document semantics of when these events should be bound
  #bokeh events
  b_events : {
    "change:children model" : "build_children",
    "change model":           "render",
    "change viewstate"      : "render",
    "destroy model"         : "remove"}


  build_children : ->
    childmodels = []
    for row in @mget_obj('children')
      for plot in row
        childmodels.push(plot)
    build_views(@childviews, childmodels, {})
    @set_child_view_states()

  render : ->
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

class GridPlotContainer extends HasParent
  type : 'GridPlotContainer'
  default_view : GridPlotContainerView

GridPlotContainer::defaults = _.clone(GridPlotContainer::defaults)
_.extend(GridPlotContainer::defaults
  ,
    children : [[]]
    border_space : 0
)

class GridPlotContainers extends Backbone.Collection
  model : GridPlotContainer

class Plot extends HasParent
  type : 'Plot'
  default_view : PlotView
  parent_properties : ['background_color', 'foreground_color',
    'width', 'height', 'border_space', 'unselected_color']
Plot::defaults = _.clone(Plot::defaults)
_.extend(Plot::defaults , {
  'data_sources' : {},
  'renderers' : [],
  'axes' : [],
  'legends' : [],
  'tools' : [],
  'overlays' : [],
  'usedialog' : false,
  'title' : 'Plot'
  #axes fit here
})
Plot::display_defaults = _.clone(Plot::display_defaults)
_.extend(Plot::display_defaults
  ,
    background_color : "#eee"
    foreground_color : "#333"
    unselected_color : "#ccc"
)

class Plots extends Backbone.Collection
   model : Plot

class PlotContext extends HasParent
  type : 'PlotContext',
  default_view : PlotContextView
  url : () ->
    return super()
  defaults :
    children : []
    render_loop : true

class PlotContexts extends Backbone.Collection
  model : PlotContext

class ViewState extends HasParent
  # This Viewstate has height/width/border_space information
  # Primarily used by PlotViews
  initialize : (attrs, options)->
    super(attrs, options)
    @register_property('outerwidth',
        () -> @get('width') + 2 * @get('border_space')
      , false)
    @add_dependencies('outerwidth', this, ['width', 'border_space'])
    @register_property('outerheight',
       () -> @get('height') + 2 * @get('border_space')
      , false)
    @add_dependencies('outerheight', this, ['height', 'border_space'])
  #transform our coordinate space to the underlying device (svg)
  xpos : (x) ->
    return x
  ypos : (y) ->
    return @get('height') - y

  #vectorized versions of xpos/ypos, operates in place
  v_xpos : (xx) ->
    return xx
  v_ypos : (yy) ->
    height = @get('height')
    for y, idx in yy
       yy[idx] = height - y
    return yy

  #transform underlying device (svg) to our coordinate space
  rxpos : (x) ->
    return x

  rypos : (y) ->
    return @get('height') - y

  #compute a childs position in the underlying device
  position_child_x : (childsize, offset) ->
    return  @xpos(offset)
  position_child_y : (childsize, offset) ->
    return @ypos(offset) - childsize

  defaults :
    parent : null

  display_defaults:
    width : 200
    height : 200
    position : 0
    offset : [0,0]
    border_space : 30

class GridViewState extends ViewState
  setup_layout_properties : () =>
    @register_property('layout_heights', @layout_heights, true)
    @register_property('layout_widths', @layout_widths, true)
    for row in @get('childviewstates')
      for viewstate in row
        @add_dependencies('layout_heights', viewstate, 'outerheight')
        @add_dependencies('layout_widths', viewstate, 'outerwidth')

  initialize : (attrs, options) ->
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

  maxdim : (dim, row) ->
    if row.length == 0
      return 0
    else
      return _.max(_.map(row, ((x) -> return x.get(dim))))

  layout_heights : () =>
    row_heights=(@maxdim('outerheight',row) for row in @get('childviewstates'))
    return row_heights

  layout_widths : () =>
    num_cols = @get('childviewstates')[0].length
    columns = ((row[n] for row in @get('childviewstates')) for n in _.range(num_cols))
    col_widths = (@maxdim('outerwidth', col) for col in columns)
    return col_widths

GridViewState::defaults = _.clone(GridViewState::defaults)
_.extend(GridViewState::defaults
  ,
    childviewstates : [[]]
    border_space : 0
)

exports.gridplotcontainers = new GridPlotContainers
exports.plots = new Plots
exports.plotcontexts = new PlotContexts()

exports.PlotContextView = PlotContextView
exports.PlotContextViewState = PlotContextViewState
exports.PlotContextViewWithMaximized = PlotContextViewWithMaximized
exports.SinglePlotContextView = SinglePlotContextView
exports.PlotView = PlotView
exports.GridPlotContainerView = GridPlotContainerView
exports.GridPlotContainer = GridPlotContainer
exports.Plot = Plot
exports.PlotContext = PlotContext
exports.ViewState = ViewState
exports.GridViewState = GridViewState
