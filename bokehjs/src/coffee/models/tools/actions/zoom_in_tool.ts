import {ActionTool, ActionToolView} from "./action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"

import * as p from "core/properties"

export class ZoomInToolView extends ActionToolView {
  model: ZoomInTool

  doit(): void {
    const frame = this.plot_model.frame
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property
    const h_axis = dims == 'width'  || dims == 'both'
    const v_axis = dims == 'height' || dims == 'both'

    const zoom_info = scale_range(frame, this.model.factor, h_axis, v_axis)

    this.plot_view.push_state('zoom_out', {range: zoom_info})
    this.plot_view.update_range(zoom_info, false, true)

    if (this.model.document)
      this.model.document.interactive_start(this.plot_model.plot)
  }
}

export namespace ZoomInTool {
  export interface Attrs extends ActionTool.Attrs {
    factor: number
    dimensions: Dimensions
  }

  export interface Props extends ActionTool.Props {}
}

export interface ZoomInTool extends ZoomInTool.Attrs {}

export class ZoomInTool extends ActionTool {

  properties: ZoomInTool.Props

  constructor(attrs?: Partial<ZoomInTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ZoomInTool"
    this.prototype.default_view = ZoomInToolView

    this.define({
      factor:     [ p.Percent,    0.1    ],
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  tool_name = "Zoom In"
  icon = "bk-tool-icon-zoom-in"

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}

ZoomInTool.initClass()
