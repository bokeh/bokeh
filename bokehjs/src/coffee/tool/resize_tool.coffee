
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
      buttonHook: "resize"
      buttonIcon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAgCAYAAAB3j6rJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODVDNDBCQjIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODVDNDBCQzIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjMyMUREOEQ4MjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkE4NUM0MEJBMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+nIbQ0AAAAIJJREFUeNpiXLhs5X8G7ICRgTYAq31MDIMEwBzyERoCyJhWAN2ej4MqRFiIjUMahczgSyMsNE4PxACBQZlrcAFsuYkcLECpQwZNiIw6ZNQhow4ZdcioQ0YdMuoQerRZkQE/vdqwgypqQD7+MIBuANn9f1CnEcbRXIMjd4zM0QCAAAMAbdAPQaze1JcAAAAASUVORK5CYII="
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

  class ResizeTools extends Backbone.Collection
    model: ResizeTool

  return {
    "Model": ResizeTool
    "Collection": new ResizeTools(),
    "View": ResizeToolView
  }
