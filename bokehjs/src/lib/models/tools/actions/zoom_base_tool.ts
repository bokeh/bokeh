import {ActionTool, ActionToolView} from "./action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"

export class ZoomBaseToolView extends ActionToolView {
  model: ZoomBaseTool

  doit(): void {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property
    const h_axis = dims == 'width'  || dims == 'both'
    const v_axis = dims == 'height' || dims == 'both'

    const zoom_info = scale_range(frame, this.model.sign * this.model.factor, h_axis, v_axis)

    this.plot_view.push_state('zoom_out', {range: zoom_info})
    this.plot_view.update_range(zoom_info, false, true)

    if (this.model.document)
      this.model.document.interactive_start(this.plot_model)
  }
}

export namespace ZoomBaseTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    factor: p.Property<number>
    dimensions: p.Property<Dimensions>
  }
}

export interface ZoomBaseTool extends ZoomBaseTool.Attrs {}

export class ZoomBaseTool extends ActionTool {
  properties: ZoomBaseTool.Props
  __view_type__: ZoomBaseToolView

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static init_ZoomBaseTool(): void {
    this.prototype.default_view = ZoomBaseToolView

    this.define<ZoomBaseTool.Props>({
      factor:     [ p.Percent,    0.1    ],
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  sign: number
  tool_name: string
  icon: string

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}
