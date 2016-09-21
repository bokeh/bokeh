ActionTool = require "./action_tool"
{scale_range} = require "../../../util/zoom"
{logger} = require "../../../core/logging"

p = require "../../../core/properties"

class ZoomOutToolView extends ActionTool.View

  do: () ->
    frame = @plot_model.frame
    dims = @model.dimensions

    # restrict to axis configured in tool's dimensions property
    if dims.indexOf('width') == -1
      v_axis_only = true
    if dims.indexOf('height') == -1
      h_axis_only = true

    zoom_info = scale_range({
      frame: frame
      factor: -@model.factor  # zooming out requires a negative factor to scale_range
      v_axis_only: v_axis_only
      h_axis_only: h_axis_only
    })
    @plot_view.push_state('zoom_out', {range: zoom_info})
    @plot_view.update_range(zoom_info, false, true)
    @plot_view.interactive_timestamp = Date.now()
    return null

class ZoomOutTool extends ActionTool.Model
  default_view: ZoomOutToolView
  type: "ZoomOutTool"
  tool_name: "Zoom Out"
  icon: "bk-tool-icon-zoom-out"

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @_check_dims(@dimensions, "zoom out tool"))
  }

  @define {
    factor: [ p.Percent, 0.1 ]
    dimensions: [ p.Array, ["width", "height"] ]
  }

module.exports = {
  Model: ZoomOutTool
  View: ZoomOutToolView
}
