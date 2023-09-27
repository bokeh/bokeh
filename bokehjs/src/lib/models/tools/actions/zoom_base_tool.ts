import {PlotActionTool, PlotActionToolView} from "./plot_action_tool"
import {DataRenderer} from "../../renderers/data_renderer"
import {Dimensions} from "core/enums"
import {scale_range} from "core/util/zoom"
import {assert} from "core/util/assert"
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
    const {x_target, y_target} = frame

    const x_frame_scales = new Map(frame.x_scales)
    const y_frame_scales = new Map(frame.y_scales)

    const {renderers} = this.model
    if (renderers != "auto") {
      const x_range_names = new Set<string>()
      const y_range_names = new Set<string>()

      for (const renderer of renderers) {
        if (renderer.coordinates == null) {
          x_range_names.add(renderer.x_range_name)
          y_range_names.add(renderer.y_range_name)
        }
      }

      for (const name of x_frame_scales.keys()) {
        if (!x_range_names.has(name)) {
          x_frame_scales.delete(name)
        }
      }
      for (const name of y_frame_scales.keys()) {
        if (!y_range_names.has(name)) {
          y_frame_scales.delete(name)
        }
      }
    }

    const x_scales = [...x_frame_scales.values()]
    const y_scales = [...y_frame_scales.values()]

    const data_renderers = renderers != "auto" ? renderers : this.plot_view.model.data_renderers

    for (const renderer of data_renderers) {
      if (renderer.coordinates == null) {
        continue
      }

      const rv = this.plot_view.renderer_view(renderer)
      assert(rv != null)

      const {x_scale, y_scale} = rv.coordinates
      x_scales.push(x_scale)
      y_scales.push(y_scale)
    }

    const zoom_info = scale_range(x_scales, y_scales, x_target, y_target, this.factor, x_axis, y_axis)

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
    renderers: p.Property<DataRenderer[] | "auto">
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
    this.define<ZoomBaseTool.Props>(({Percent, Or, Array, Ref, Auto}) => ({
      factor:     [ Percent,    0.1    ],
      dimensions: [ Dimensions, "both" ],
      renderers:  [ Or(Array(Ref(DataRenderer)), Auto), "auto" ],
    }))
  }

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  abstract readonly maintain_focus: boolean
}
