import {ActionTool, ActionToolView} from "./action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"
import {bk_tool_icon_zoom_in} from "styles/icons"

export class ZoomInToolView extends ActionToolView {
  model: ZoomInTool

  doit(): void {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property
    const h_axis = dims == 'width'  || dims == 'both'
    const v_axis = dims == 'height' || dims == 'both'

    const zoom_info = scale_range(frame.bbox, this.model.factor, h_axis, v_axis)
    const range_info = this.plot_view.update_range_from_screen(zoom_info, false, true)
    if (range_info != null)
      this.plot_view.push_state('zoom_out', {range: range_info})

    if (this.model.document)
      this.model.document.interactive_start(this.plot_model)
  }
}

export namespace ZoomInTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    factor: p.Property<number>
    dimensions: p.Property<Dimensions>
  }
}

export interface ZoomInTool extends ZoomInTool.Attrs {}

export class ZoomInTool extends ActionTool {
  properties: ZoomInTool.Props

  constructor(attrs?: Partial<ZoomInTool.Attrs>) {
    super(attrs)
  }

  static init_ZoomInTool(): void {
    this.prototype.default_view = ZoomInToolView

    this.define<ZoomInTool.Props>({
      factor:     [ p.Percent,    0.1    ],
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  tool_name = "Zoom In"
  icon = bk_tool_icon_zoom_in

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}
