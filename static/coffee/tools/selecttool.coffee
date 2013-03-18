toolview = require("./toolview")
ToolView = toolview.ToolView
eventgenerators = require("./eventgenerators")
TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator
mapper = require("../mapper")
LinearMapper = mapper.LinearMapper
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

class SelectionToolView extends ToolView
  initialize : (options) ->
    super(options)
    select_callback = _.debounce((() => @_select_data()), 50)
    safebind(this, @model, 'change', @request_render)
    safebind(this, @model, 'change', select_callback)
    for renderer in @mget_obj('renderers')
      safebind(this, renderer, 'change', @request_render)
      safebind(this, renderer.get_obj('xdata_range'), 'change',
        @request_render)
      safebind(this, renderer.get_obj('ydata_range'), 'change',
        @request_render)
      safebind(this, renderer.get_obj('data_source'), 'change',
        @request_render)
      safebind(this, renderer, 'change', select_callback)
      safebind(this, renderer.get_obj('xdata_range'), 'change',
        select_callback)
      safebind(this, renderer.get_obj('ydata_range'), 'change',
        select_callback)
  eventGeneratorClass : TwoPointEventGenerator
  evgen_options : {keyName:"ctrlKey", buttonText:"Select"}
  tool_events : {
    UpdatingMouseMove: "box_selecting",
    SetBasepoint : "_start_selecting",
    DragEnd: "_selecting",
    deactivated : "_stop_selecting"}

  mouse_coords : (e, x, y) ->
    [x, y] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x, y]

  _stop_selecting : () ->
    @trigger('stopselect')
    @basepoint_set = false

  _start_selecting : (e) ->
    @trigger('startselect')
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    @mset({'start_x' : x, 'start_y' : y, 'current_x' : null, 'current_y' : null})
    @basepoint_set = true

  _get_selection_range : ->
    xrange = [@mget('start_x'), @mget('current_x')]
    yrange = [@mget('start_y'), @mget('current_y')]
    if @mget('select_x')
      xrange = [d3.min(xrange), d3.max(xrange)]
    else
      xrange = null
    if @mget('select_y')
      yrange = [d3.min(yrange), d3.max(yrange)]
    else
      yrange = null
    return [xrange, yrange]

  _get_selection_range_fast : (current_x, current_y)->
    xrange = [@mget('start_x'), current_x]
    yrange = [@mget('start_y'), current_y]
    if @mget('select_x')
      xrange = [d3.min(xrange), d3.max(xrange)]
    else
      xrange = null
    if @mget('select_y')
      yrange = [d3.min(yrange), d3.max(yrange)]
    else
      yrange = null
    return [xrange, yrange]

  _selecting : (e, x_, y_) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    @mset({'current_x' : x, 'current_y' : y})
    [@xrange, @yrange] = @_get_selection_range_fast(x, y)
    @trigger('boxselect', @xrange, @yrange)
    return null

  box_selecting : (e, x_, y_) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    [@xrange, @yrange] = @_get_selection_range_fast(x, y)
    @trigger('boxselect', @xrange, @yrange)
    return null

  _select_data : () ->
    if not @basepoint_set
      return
    datasources = {}
    datasource_selections = {}
    for renderer in @mget_obj('renderers')
      datasource = renderer.get_obj('data_source')
      datasources[datasource.id] = datasource

    for renderer in @mget_obj('renderers')
      datasource_id = renderer.get_obj('data_source').id
      _.setdefault(datasource_selections, datasource_id, [])
      selected = @plot_view.renderers[renderer.id].select(@xrange, @yrange)
      datasource_selections[datasource_id].push(selected)

    for own k,v of datasource_selections
      selected = _.intersection.apply(_, v)
      datasources[k].set('selected', selected)
      datasources[k].save()
    return null



class SelectionTool extends HasParent
  type : "SelectionTool"
  default_view : SelectionToolView

SelectionTool::defaults = _.clone(SelectionTool::defaults)
_.extend(SelectionTool::defaults
  ,
    renderers : []
    select_x : true
    select_y : true
    data_source_options : {} #backbone options for save on datasource
)

class SelectionTools extends Backbone.Collection
  model : SelectionTool


exports.SelectionToolView = SelectionToolView
exports.selectiontools = new SelectionTools