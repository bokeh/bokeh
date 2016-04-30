_ = require "underscore"

GestureTool = require "./gesture_tool"
p = require "../../../core/properties"

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
    return @

class ResizeTool extends GestureTool.Model
  default_view: ResizeToolView
  type: "ResizeTool"
  tool_name: "Resize"
  icon: "bk-tool-icon-resize"
  event_type: "pan"
  default_order: 40

module.exports =
  Model: ResizeTool
  View: ResizeToolView
