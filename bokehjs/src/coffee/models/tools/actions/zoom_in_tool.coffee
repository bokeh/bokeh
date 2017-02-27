import {ActionTool, ActionToolView} from "./action_tool"
import {scale_range} from "core/util/zoom"
import {logger} from "core/logging"

import * as p from "core/properties"

export class ZoomInToolView extends ActionToolView

  do: () ->
    frame = @plot_model.frame
    dims = @model.dimensions

    # restrict to axis configured in tool's dimensions property
    h_axis = dims == 'width'  or dims == 'both'
    v_axis = dims == 'height' or dims == 'both'

    zoom_info = scale_range(frame, @model.factor, h_axis, v_axis)

    @plot_view.push_state('zoom_out', {range: zoom_info})
    @plot_view.update_range(zoom_info, false, true)
    @plot_view.interactive_timestamp = Date.now()
    return null

export class ZoomInTool extends ActionTool
  default_view: ZoomInToolView
  type: "ZoomInTool"
  tool_name: "Zoom In"
  icon: "bk-tool-icon-zoom-in"

  @getters {
    tooltip: () -> @_get_dim_tooltip(@tool_name, @dimensions)
  }

  @define {
    factor:     [ p.Percent,    0.1    ]
    dimensions: [ p.Dimensions, "both" ]
  }
