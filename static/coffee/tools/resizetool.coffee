tool = require("./tool")
eventgenerators = require("./eventgenerators")
TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator
LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper
base = require("../base")

class ResizeToolView extends tool.ToolView
  initialize: (options) ->
    super(options)

  bind_events: (plotview) ->
    super(plotview)
    @tool_active = true
    @button_activated = true

  eventGeneratorClass: TwoPointEventGenerator
  evgen_options: {keyName:"", buttonText:"Resize"}
  tool_events: {
    UpdatingMouseMove: "_drag",
    SetBasepoint: "_set_base_point"
  }

  render: () ->
    return this

    ctx = @plot_view.ctx

    cw = @plot_view.view_state.get('canvas_width')
    ch = @plot_view.view_state.get('canvas_height')

    line_width = 8

    ctx.save()

    ctx.strokeStyle = 'grey'
    ctx.globalAlpha = 0.7
    ctx.lineWidth   = line_width
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.rect(line_width, line_width, cw-line_width*2, ch-line_width*2)
    ctx.moveTo(line_width, line_width)
    ctx.lineTo(cw-line_width, ch-line_width)
    ctx.moveTo(line_width, ch-line_width)
    ctx.lineTo(cw-line_width, line_width)
    ctx.stroke()

    ctx.restore()

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


class ResizeTool extends tool.Tool
  type: "ResizeTool"
  default_view: ResizeToolView

ResizeTool::defaults = _.clone(ResizeTool::defaults)
_.extend(ResizeTool::defaults)

ResizeTool::display_defaults = _.clone(ResizeTool::display_defaults)
_.extend(ResizeTool::display_defaults)


class ResizeTools extends Backbone.Collection
  model: ResizeTool

exports.ResizeToolView = ResizeToolView
exports.resizetools = new ResizeTools