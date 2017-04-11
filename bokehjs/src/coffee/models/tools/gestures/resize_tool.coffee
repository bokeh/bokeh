import {GestureTool, GestureToolView} from "./gesture_tool"
import {show, hide} from "core/dom"

export class ResizeToolView extends GestureToolView
  className: "bk-resize-popup"

  initialize: (options) ->
    super(options)
    wrapper = @plot_view.el.querySelector('div.bk-canvas-wrapper')
    wrapper.appendChild(@el)
    hide(@el)
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
      left = canvas.vx_to_sx(frame.h_range.end-40)
      top = canvas.vy_to_sy(frame.v_range.start+40)
      @el.style.position = "absolute"
      @el.style.top = "#{top}px"
      @el.style.left = "#{left}px"
      show(@el)
    else
      hide(@el)
    return @

  _pan_start: (e) ->
    canvas = @plot_view.canvas
    @ch = canvas.height
    @cw = canvas.width
    @plot_view.interactive_timestamp = Date.now()
    return null

  _pan: (e) ->
    @_update(e.deltaX, e.deltaY)
    @plot_view.interactive_timestamp = Date.now()
    return null

  _pan_end: (e) ->
    @plot_view.push_state("resize", {
      dimensions: {
        width: @plot_view.canvas.width
        height: @plot_view.canvas.height
      }
    })

  _update: (dx, dy) ->
    new_width = @cw + dx
    new_height = @ch + dy
    if new_width < 100 or new_height < 100
      # TODO (bird) This should probably be more intelligent, so that resize can
      # go as small as possible without breaking, but 100 x 100 seems reasonable
      # as a hardcoded value for now.
      return
    @plot_view.update_dimensions(new_width, new_height)
    return

export class ResizeTool extends GestureTool
  default_view: ResizeToolView
  type: "ResizeTool"
  tool_name: "Resize"
  icon: "bk-tool-icon-resize"
  event_type: "pan"
  default_order: 40
