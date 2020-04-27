import {ActionTool, ActionToolView} from "./action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"
import {bk_tool_icon_zoom_out} from "styles/icons"

export class ZoomOutToolView extends ActionToolView {
  model: ZoomOutTool

  doit(): void {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property
    const h_axis = dims == 'width'  || dims == 'both'
    const v_axis = dims == 'height' || dims == 'both'

    // zooming out requires a negative factor to scale_range
    const zoom_info = scale_range(frame, -this.model.factor, h_axis, v_axis)

    this.plot_view.push_state('zoom_out', {range: zoom_info})
    this.plot_view.update_range(zoom_info, false, true)

    this.plot_view.canvas_view.interactive_start(this.plot_model)
  }
}

export namespace ZoomOutTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ActionTool.Props & {
    factor: p.Property<number>
    dimensions: p.Property<Dimensions>
  }
}

export interface ZoomOutTool extends ZoomOutTool.Attrs {}

export class ZoomOutTool extends ActionTool {
  properties: ZoomOutTool.Props
  __view_type__: ZoomOutToolView

  constructor(attrs?: Partial<ZoomOutTool.Attrs>) {
    super(attrs)
  }

  static init_ZoomOutTool(): void {
    this.prototype.default_view = ZoomOutToolView

    this.define<ZoomOutTool.Props>({
      factor:     [ p.Percent,    0.1    ],
      dimensions: [ p.Dimensions, "both" ],
    })

    this.register_alias("zoom_out", () => new ZoomOutTool({dimensions: 'both'}))
    this.register_alias("xzoom_out", () => new ZoomOutTool({dimensions: 'width'}))
    this.register_alias("yzoom_out", () => new ZoomOutTool({dimensions: 'height'}))
  }

  tool_name = "Zoom Out"
  icon = bk_tool_icon_zoom_out

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}
