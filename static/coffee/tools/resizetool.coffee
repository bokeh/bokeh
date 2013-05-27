toolview = require("./toolview")
ToolView = toolview.ToolView
eventgenerators = require("./eventgenerators")
TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator
LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper
base = require("../base")
safebind = base.safebind
HasParent = base.HasParent

class ResizeToolView extends ToolView
  initialize: (options) ->
    super(options)

  bind_events : (plotview) ->
    super(plotview)
    @tool_active = true
    @button_activated = true

  eventGeneratorClass: TwoPointEventGenerator
  evgen_options: {keyName:"", buttonText:"Resize"}
  tool_events: {
    UpdatingMouseMove: "_drag",
    SetBasepoint: "_set_base_point"
  }

  mouse_coords: (e, x, y) ->
    return [x, y]

  _set_base_point: (e) ->
    [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
    return null

  _drag: (e) ->
    @plot_view.pause()
    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]

    oh = @plot_view.view_state.get('outer_height')
    @plot_view.view_state.set('outer_height', oh+ydiff)
    @plot_view.view_state.set('canvas_height', oh+ydiff)

    ow = @plot_view.view_state.get('outer_width')
    @plot_view.view_state.set('outer_width', ow+xdiff)
    @plot_view.view_state.set('canvas_width', ow+xdiff)

    @plot_view.unpause()

    @plot_view.view_state.trigger('change')

    @plot_view.request_render()

    return null


class ResizeTool extends HasParent
  type: "ResizeTool"
  default_view: ResizeToolView

ResizeTool::defaults = _.clone(ResizeTool::defaults)
_.extend(ResizeTool::defaults)


class ResizeTools extends Backbone.Collection
  model: ResizeTool

exports.ResizeToolView = ResizeToolView
exports.resizetools = new ResizeTools