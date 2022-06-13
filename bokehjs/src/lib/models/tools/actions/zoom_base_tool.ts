import {ActionTool, ActionToolView} from "./action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"

export abstract class ZoomBaseToolView extends ActionToolView {
  override model: ZoomBaseTool

  doit(): void {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property
    const h_axis = dims == "width"  || dims == "both"
    const v_axis = dims == "height" || dims == "both"

    const zoom_info = scale_range(frame, this.model.sign*this.model.factor, h_axis, v_axis)

    this.plot_view.state.push("zoom_out", {range: zoom_info})
    this.plot_view.update_range(zoom_info, {scrolling: true, maintain_focus: this.model.maintain_focus})

    this.model.document?.interactive_start(this.plot_model)

    this.plot_view.trigger_ranges_update_event()
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

export abstract class ZoomBaseTool extends ActionTool {
  override properties: ZoomBaseTool.Props
  override __view_type__: ZoomBaseToolView

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ZoomBaseTool.Props>(({Percent}) => ({
      factor:     [ Percent,    0.1    ],
      dimensions: [ Dimensions, "both" ],
    }))
  }

  readonly sign: -1 | 1

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  abstract readonly maintain_focus: boolean
}
