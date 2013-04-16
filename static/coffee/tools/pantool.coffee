toolview = require("./toolview")
ToolView = toolview.ToolView
eventgenerators = require("./eventgenerators")
TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator
LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

class PanToolView extends ToolView
  initialize: (options) ->
    super(options)
    @build_mappers()

  bind_bokeh_events: () ->
    safebind(this, @model, 'change:dataranges', @build_mappers)

  build_mappers: () =>
    @mappers = {}
    for temp in _.zip(@mget_obj('dataranges'), @mget('dimensions'))
      [datarange, dim] = temp
      if dim == 'width'
        mapper = new LinearMapper({
          source_range: datarange
          target_range: @plot_view.view_state.get('inner_range_horizontal')
        })
      else
        mapper = new LinearMapper({
          source_range: datarange
          target_range: @plot_view.view_state.get('inner_range_vertical')
        })
      @mappers[dim] = mapper
    return @mappers

  eventGeneratorClass: TwoPointEventGenerator
  evgen_options: {keyName:"shiftKey", buttonText:"Pan"}
  tool_events: {
    UpdatingMouseMove: "_drag",
    SetBasepoint: "_set_base_point"}

  mouse_coords: (e, x, y) ->
    [x_, y_] = [@plot_view.view_state.device_to_sx(x), @plot_view.view_state.device_to_sy(y)]
    return [x_, y_]

  _set_base_point: (e) ->
    [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
    return null

  _drag: (e) ->
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]

    sx_low = 0 - xdiff
    sx_high = @plot_view.view_state.get('inner_width') - xdiff
    sy_low = 0 - ydiff
    sy_high = @plot_view.view_state.get('inner_height') - ydiff

    xstart = @plot_view.xmapper.map_from_target(sx_low)
    xend   = @plot_view.xmapper.map_from_target(sx_high)
    ystart = @plot_view.ymapper.map_from_target(sy_low)
    yend   = @plot_view.ymapper.map_from_target(sy_high)

    @plot_view.x_range.set({start: xstart, end: xend})
    @plot_view.y_range.set({start: ystart, end: yend})

    return null


class PanTool extends HasParent
  type: "PanTool"
  default_view: PanToolView

PanTool::defaults = _.clone(PanTool::defaults)
_.extend(PanTool::defaults
  ,
    dimensions: [] #height/width
    dataranges: [] #references of datarange objects
)


class PanTools extends Backbone.Collection
  model: PanTool

exports.PanToolView = PanToolView
exports.pantools = new PanTools