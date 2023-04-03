import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"
import type * as p from "core/properties"

export abstract class ZoomBaseToolView extends PlotActionToolView {
  declare model: ZoomBaseTool

  abstract get factor(): number

  doit(): void {
    // restrict to axis configured in tool's dimensions property
    const {dimensions} = this.model
    const x_axis = dimensions == "width"  || dimensions == "both"
    const y_axis = dimensions == "height" || dimensions == "both"

    const {frame} = this.plot_view
    const {x_range, y_range} = frame.bbox
    const {x_scales, y_scales} = frame

    const zoom_info = scale_range(x_scales, y_scales, x_range, y_range, this.factor, x_axis, y_axis)

    this.plot_view.state.push("zoom_out", {range: zoom_info})
    this.plot_view.update_range(zoom_info, {scrolling: true, maintain_focus: this.model.maintain_focus})

    this.model.document?.interactive_start(this.plot_view.model)

    this.plot_view.trigger_ranges_update_event()
  }
}

export namespace ZoomBaseTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PlotActionTool.Props & {
    factor: p.Property<number>
    dimensions: p.Property<Dimensions>
  }
}

export interface ZoomBaseTool extends ZoomBaseTool.Attrs {}

export abstract class ZoomBaseTool extends PlotActionTool {
  declare properties: ZoomBaseTool.Props
  declare __view_type__: ZoomBaseToolView

  constructor(attrs?: Partial<ZoomBaseTool.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ZoomBaseTool.Props>(({Percent}) => ({
      factor:     [ Percent,    0.1    ],
      dimensions: [ Dimensions, "both" ],
    }))
  }

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  abstract readonly maintain_focus: boolean
}
