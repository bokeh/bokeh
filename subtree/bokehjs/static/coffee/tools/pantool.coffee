toolview = require("./toolview")
ToolView = toolview.ToolView
eventgenerators = require("./eventgenerators")
TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator
mapper = require("../mapper")
LinearMapper = mapper.LinearMapper
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

class PanToolView extends ToolView
  initialize : (options) ->
    super(options)
    @build_mappers()

  bind_bokeh_events : () ->
    safebind(this, @model, 'change:dataranges', @build_mappers)

  build_mappers : () =>
    @mappers = []
    for temp in _.zip(@mget_obj('dataranges'), @mget('dimensions'))
      [datarange, dim] = temp
      mapper = new LinearMapper({},
        data_range : datarange
        viewstate : @plot_view.viewstate
        screendim : dim)
      @mappers.push(mapper)
    return @mappers

  eventGeneratorClass : TwoPointEventGenerator
  evgen_options : {keyName:"shiftKey", buttonText:"Pan"}
  tool_events : {
    UpdatingMouseMove: "_drag",
    SetBasepoint : "_set_base_point"}

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x_, y_]

  _set_base_point : (e) ->
    [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
    return null

  _drag : (e) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]
    for mapper in @mappers
      if mapper.screendim == 'width'
        diff = xdiff
      else
        diff = ydiff
      screenlow = 0 - diff
      screenhigh = @plot_view.viewstate.get(mapper.screendim) - diff
      [start, end] = [mapper.map_data(screenlow),
        mapper.map_data(screenhigh)]
      mapper.data_range.set(
        start : start
        end : end)
    return null


class PanTool extends HasParent
  type : "PanTool"
  default_view : PanToolView

PanTool::defaults = _.clone(PanTool::defaults)
_.extend(PanTool::defaults
  ,
    dimensions : [] #height/width
    dataranges : [] #references of datarange objects
)


class PanTools extends Backbone.Collection
  model : PanTool

exports.PanToolView = PanToolView
exports.pantools = new PanTools