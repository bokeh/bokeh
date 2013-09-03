tool = require("./tool")
eventgenerators = require("./eventgenerators")
TwoPointEventGenerator = eventgenerators.TwoPointEventGenerator
LinearMapper = require("../mappers/1d/linear_mapper").LinearMapper
base = require("../base")

class ResizeToolView extends tool.ToolView
  initialize: (options) ->
    super(options)
    @active = false

  bind_events: (plotview) ->
    super(plotview)

  eventGeneratorClass: TwoPointEventGenerator
  evgen_options: {keyName:"", buttonText:"Resize"}
  tool_events: {
    activated: "_activate",
    deactivated: "_deactivate",
    UpdatingMouseMove: "_drag",
    SetBasepoint: "_set_base_point"
  }

  render: () ->
    if not @active
      return

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

  _activate: (e) ->
    @active = true
    @popup = $(
      '<div class="resize_popup pull-right" style="border-radius: 10px; background-color: lightgrey; padding:3px 8px; font-size: 14px"></div>'
    )
    bbar = @plot_view.$el.find('.button_bar')
    @popup.appendTo(bbar)
    ch = @plot_view.view_state.get('outer_height')
    cw = @plot_view.view_state.get('outer_width')
    @popup.text("width: #{cw} height: #{ch}")

    @plot_view.request_render()
    return null

  _deactivate: (e) ->
    @active = false
    @popup.remove()
    @plot_view.request_render()
    return null

  _set_base_point: (e) ->
    [@x, @y] = @mouse_coords(e, e.bokehX, e.bokehY)
    return null

  _drag: (e) ->
    @plot_view.pause()


    [x, y] = @mouse_coords(e, e.bokehX, e.bokehY)
    xdiff = x - @x
    ydiff = y - @y
    [@x, @y] = [x, y]

    ch = @plot_view.view_state.get('outer_height')
    cw = @plot_view.view_state.get('outer_width')

    @popup.text("width: #{cw} height: #{ch}")

    @plot_view.view_state.set('outer_height', ch+ydiff, {'silent' : true})
    @plot_view.view_state.set('outer_width', cw+xdiff, {'silent' : true})
    @plot_view.view_state.set('canvas_height', ch+ydiff, {'silent' : true})
    @plot_view.view_state.set('canvas_width', cw+xdiff, {'silent' : true})

    @plot_view.view_state.trigger('change:outer_height', ch+ydiff)
    @plot_view.view_state.trigger('change:outer_width', cw+xdiff)
    @plot_view.view_state.trigger('change:canvas_height', ch+ydiff)
    @plot_view.view_state.trigger('change:canvas_width', cw+xdiff)
    @plot_view.view_state.trigger('change', @plot_view.view_state)
    @plot_view.unpause(true)

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
