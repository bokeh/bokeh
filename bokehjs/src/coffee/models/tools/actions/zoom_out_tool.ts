import {ActionTool, ActionToolView} from "./action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"

import * as p from "core/properties"

export class ZoomOutToolView extends ActionToolView {

  model: ZoomOutTool

  doit(): void {
    const frame = this.plot_model.frame
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property
    const h_axis = dims == 'width'  || dims == 'both'
    const v_axis = dims == 'height' || dims == 'both'

    // zooming out requires a negative factor to scale_range
    const zoom_info = scale_range(frame, -this.model.factor, h_axis, v_axis)

    this.plot_view.push_state('zoom_out', {range: zoom_info})
    this.plot_view.update_range(zoom_info, false, true)

    if (this.model.document)
      this.model.document.interactive_start(this.plot_model.plot)
  }
}

export class ZoomOutTool extends ActionTool {

  static initClass() {
    this.prototype.type = "ZoomOutTool"

    this.prototype.default_view = ZoomOutToolView

    this.define({
      factor:     [ p.Percent,    0.1    ],
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  factor: number
  dimensions: Dimensions

  tool_name = "Zoom Out"
  icon = "bk-tool-icon-zoom-out"

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}

ZoomOutTool.initClass()
