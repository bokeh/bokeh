_ = require "underscore"

SelectTool = require "./select_tool"
BoxAnnotation = require "../../annotations/box_annotation"
p = require "../../../core/properties"

class BoxSelectToolView extends SelectTool.View

  _clear_overlay: () ->
    @_basepoint = null
    @model.overlay.update({left: null, right: null, top: null, bottom: null})
    return null

  _pan_start: (e) ->
    canvas = @plot_view.canvas
    @_basepoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    return null

  _pan: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.frame
    dims = @model.dimensions

    [vxlim, vylim] = @model._get_dim_limits(@_basepoint, curpoint, frame, dims)
    @model.overlay.update({left: vxlim[0], right: vxlim[1], top: vylim[1], bottom: vylim[0]})

    if @model.select_every_mousemove
      append = e.srcEvent.shiftKey ? false
      @_select(vxlim, vylim, false, append)

    return null

  _pan_end: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.frame
    dims = @model.dimensions

    [vxlim, vylim] = @model._get_dim_limits(@_basepoint, curpoint, frame, dims)
    append = e.srcEvent.shiftKey ? false
    @_select(vxlim, vylim, true, append)
    @plot_view.push_state('box_select', {selection: @plot_view.get_selection()})
    @_clear_overlay()

    return null

  _select: ([vx0, vx1], [vy0, vy1], final, append) ->
    geometry = {
      type: 'rect'
      vx0: vx0
      vx1: vx1
      vy0: vy0
      vy1: vy1
    }

    if not append
      @model._clear_current_selection()

    for r in @model._get_selectable_renderers()
      r.data_source.selector.select(@, @plot_view.renderer_views[r.id], geometry, final, true)

    cb_data = @model._get_cb_data(geometry)

    if @model.callback?
      @model._emit_callback(cb_data)

    if final
      @model._save_geometry(cb_data, append)

    return null

DEFAULT_BOX_OVERLAY = () -> new BoxAnnotation.Model({
  level: "overlay"
  render_mode: "css"
  top_units: "screen"
  left_units: "screen"
  bottom_units: "screen"
  right_units: "screen"
  fill_color: "lightgrey"
  fill_alpha: 0.5
  line_color: "black"
  line_alpha: 1.0
  line_width: 2
  line_dash: [4, 4]
})

class BoxSelectTool extends SelectTool.Model
  default_view: BoxSelectToolView
  type: "BoxSelectTool"
  tool_name: "Box Select"
  icon: "bk-tool-icon-box-select"
  event_type: "pan"
  default_order: 30

  @define {
    dimensions:             [ p.Dimensions, "both"            ]
    select_every_mousemove: [ p. Bool,    false               ]
    overlay:                [ p.Instance, DEFAULT_BOX_OVERLAY ]
  }

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @dimensions)
  }

module.exports =
  Model: BoxSelectTool
  View: BoxSelectToolView
