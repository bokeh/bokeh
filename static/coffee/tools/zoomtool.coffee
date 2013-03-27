toolview = require("./toolview")
ToolView = toolview.ToolView
eventgenerators = require("./eventgenerators")
OnePointWheelEventGenerator = eventgenerators.OnePointWheelEventGenerator
mapper = require("../mapper")
LinearMapper = mapper.LinearMapper
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

class ZoomToolView extends ToolView

  initialize : (options) ->
    super(options)
    safebind(this, @model, 'change:dataranges', @build_mappers)
    @build_mappers()

  eventGeneratorClass : OnePointWheelEventGenerator
  evgen_options : {buttonText:"Zoom"}
  tool_events : {
    zoom: "_zoom"}


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

  mouse_coords : (e, x, y) ->
    [x_, y_] = [@plot_view.viewstate.rxpos(x), @plot_view.viewstate.rypos(y)]
    return [x_, y_]

  _zoom : (e) ->
    delta = e.delta
    screenX = e.bokehX
    screenY = e.bokehY
    [x, y] = @mouse_coords(e, screenX, screenY)
    speed = @mget('speed')
    factor = - speed  * (delta * 50)
    for mapper in @mappers
      if mapper.screendim == 'width'
        eventpos = x
      else
        eventpos = y
      screenlow = 0
      screenhigh = @plot_view.viewstate.get(mapper.screendim)
      start = screenlow - (eventpos - screenlow) * factor
      end = screenhigh + (screenhigh - eventpos) * factor
      [start, end] = [mapper.map_data(start), mapper.map_data(end)]
      mapper.data_range.set(
        start : start
        end : end
      )
    return null




class ZoomTool extends HasParent
  type : "ZoomTool"
  default_view : ZoomToolView
ZoomTool::defaults = _.clone(ZoomTool::defaults)
_.extend(ZoomTool::defaults
  ,
    dimensions : []
    dataranges : []
    speed : 1/600
)

class ZoomTools extends Backbone.Collection
  model : ZoomTool



exports.ZoomToolView = ZoomToolView
exports.zoomtools = new ZoomTools