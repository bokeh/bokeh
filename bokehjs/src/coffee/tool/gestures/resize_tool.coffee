
define [
  "underscore",
  "common/collection",
  "tool/gestures/gesture_tool",
], (_, Collection, GestureTool) ->

  class ResizeToolView extends GestureTool.View
    className: "bk-resize-popup pull-right"

    initialize: (options) ->
      super(options)
      wrapper = @plot_view.$el.find('div.bk-canvas-wrapper')
      @$el.appendTo(wrapper)
      @$el.hide()
      return null

    activate: () ->
      @$el.show()
      return null

    deactivate: () ->
      @$el.hide()
      return null

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

      # TODO (bev) proper non-private API
      canvas = @plot_view.canvas
      canvas._set_dims([@cw+dx, @ch+dy])

      @plot_view.request_render()

      @plot_view.unpause()

      return null

  class ResizeTool extends GestureTool.Model
    default_view: ResizeToolView
    type: "ResizeTool"
    tool_name: "Resize"
    icon: "bk-icon-resize"
    event_type: "pan"
    default_order: 40

  class ResizeTools extends Collection
    model: ResizeTool

  return {
    "Model": ResizeTool
    "Collection": new ResizeTools(),
    "View": ResizeToolView
  }
