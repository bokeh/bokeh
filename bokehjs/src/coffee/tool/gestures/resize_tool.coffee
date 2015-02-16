
define [
  "underscore",
  "common/collection",
  "tool/gestures/gesture_tool",
], (_, Collection, GestureTool) ->

  class ResizeToolView extends GestureTool.View
    className: "bk-resize-popup"

    initialize: (options) ->
      super(options)
      wrapper = @plot_view.$el.find('div.bk-canvas-wrapper')
      @$el.appendTo(wrapper)
      @$el.hide()
      @active = false
      return null

    activate: () ->
      @active = true
      @render()
      return null

    deactivate: () ->
      @active = false
      @render()
      return null

    render: (ctx) ->
      if @active
        canvas = @plot_view.canvas
        frame = @plot_view.frame
        left = canvas.vx_to_sx(frame.get('h_range').get('end')-40)
        top = canvas.vy_to_sy(frame.get('v_range').get('start')+40)
        @$el.attr('style',
          "position:absolute; top:#{top}px; left:#{left}px;"
        )
        @$el.show()
      else
        @$el.hide()

    _pan_start: (e) ->
      canvas = @plot_view.canvas
      @ch = canvas.get('height')
      @cw = canvas.get('width')
      return null

    _pan: (e) ->
      @_update(e.deltaX, e.deltaY)
      return null

    _update: (dx, dy) ->
      @plot_view.pause()
      canvas = @plot_view.canvas
      canvas._set_dims([@cw+dx, @ch+dy]) # TODO (bev) proper non-private API
      @plot_view.unpause()
      return null

  class ResizeTool extends GestureTool.Model
    default_view: ResizeToolView
    type: "ResizeTool"
    tool_name: "Resize"
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAgCAYAAAB3j6rJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYxIDY0LjE0MDk0OSwgMjAxMC8xMi8wNy0xMDo1NzowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNS4xIE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpBODVDNDBCQjIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpBODVDNDBCQzIwQjMxMUU0ODREQUYzNzM5QTM2MjBCRSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjMyMUREOEQ4MjBCMjExRTQ4NERBRjM3MzlBMzYyMEJFIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkE4NUM0MEJBMjBCMzExRTQ4NERBRjM3MzlBMzYyMEJFIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+nIbQ0AAAAIJJREFUeNpiXLhs5X8G7ICRgTYAq31MDIMEwBzyERoCyJhWAN2ej4MqRFiIjUMahczgSyMsNE4PxACBQZlrcAFsuYkcLECpQwZNiIw6ZNQhow4ZdcioQ0YdMuoQerRZkQE/vdqwgypqQD7+MIBuANn9f1CnEcbRXIMjd4zM0QCAAAMAbdAPQaze1JcAAAAASUVORK5CYII="
    event_type: "pan"
    default_order: 40

  class ResizeTools extends Collection
    model: ResizeTool

    defaults: () ->
      return _.extend({}, super(), {
        level: 'overlay'
        data: {}
      })


  return {
    "Model": ResizeTool
    "Collection": new ResizeTools(),
    "View": ResizeToolView
  }
