
define [
  "underscore",
  "backbone",
  "./tool",
  "./event_generators",
], (_, Backbone, Tool, EventGenerators) ->

  TwoPointEventGenerator = EventGenerators.TwoPointEventGenerator

  class ResizeToolView extends Tool.View
    initialize: (options) ->
      super(options)
      @active = false

    bind_events: (plotview) ->
      super(plotview)

    eventGeneratorClass: TwoPointEventGenerator
    toolType: "ResizeTool"

    evgen_options:
      keyName: ""
      buttonText: "Resize"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAABO0lEQVRIS+2W3RHCIBCEpQNLsAQ7UCvREmIF2oG2YCVqB0kHlmAHeHvDzVz40QQyjA9hhpcA98Fy3MYsKjdTmbeoD7TWruiU+8hJb8aYV44CFPNM66y3luMZGtzSwD0SeEcTHplAH4YwHE8DO/rYKEBLE96ZQBxC2sEpGACfBNATc1jBGifvKXZCBtIEyLiZgCbxcJ894Jo+XKlDwkYBIXGWpG7DAoSk6A3Fb4NnoYClSRO9op/ARIqnFOfUpzXI0mxgLMVTQFZlBvbk8ZPGyTP0lcyShvb0D5KOqa9c8IuexdBs0fO+AmkQtfRCvfNqaVtQS6GKrqUw+CPXUmXAMgGFHJsobWIGgVtgN3D86n4ICbXjQ+Ise3KqSQ0Wewoc35ew1J6i8XCHy8SdTfVPI2COV/+/tDQVx67/AE3wMizROWPwAAAAAElFTkSuQmCC"
      cursor: "move"

    tool_events:
      activated: "_activate"
      deactivated: "_deactivate"
      UpdatingMouseMove: "_drag"
      SetBasepoint: "_set_base_point"

    render: () ->
      if not @active
        return

      ctx = @plot_view.canvas_view.ctx

      cw = @plot_view.canvas.get('width')
      ch = @plot_view.canvas.get('height')

      line_width = 8

      ctx.save()

      ctx.strokeStyle = 'transparent'
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
      if @active
        return
      @active = true
      @popup = $(
        '''<div class="resize_bokeh_plot pull-right hide"/>''')
      bbar = @plot_view.$el.find('.bokeh_canvas_wrapper')
      plotarea = @plot_view.$el.find('.plotarea')
      @popup.appendTo(bbar)
      ch = @plot_view.canvas.get('height')
      cw = @plot_view.canvas.get('width')
      @plot_view.request_render(true)
      return null

    _deactivate: (e) ->
      @active = false
      @popup.remove()
      @request_render()
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

      ch = @plot_view.canvas.get('height')
      cw = @plot_view.canvas.get('width')

      @plot_view.canvas._set_dims([cw+xdiff, ch+ydiff])
      @plot_view.request_render()
      @plot_view.unpause(true)

      return null

  class ResizeTool extends Tool.Model
    default_view: ResizeToolView
    type: "ResizeTool"

    display_defaults: () ->
      super()

  class ResizeTools extends Backbone.Collection
    model: ResizeTool

  return {
    "Model": ResizeTool
    "Collection": new ResizeTools(),
    "View": ResizeToolView
  }
