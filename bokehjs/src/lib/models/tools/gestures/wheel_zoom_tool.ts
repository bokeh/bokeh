import {GestureTool, GestureToolView} from "./gesture_tool"
import {DataRenderer} from "../../renderers/data_renderer"
import type {Scale} from "../../scales/scale"
import {CompositeScale} from "../../scales/composite_scale"
import {scale_range} from "core/util/zoom"
import type * as p from "core/properties"
import type {PinchEvent, ScrollEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import {logger} from "core/logging"
import {assert} from "core/util/assert"
import {tool_icon_wheel_zoom} from "styles/icons.css"
import {Enum, Array, Ref, Or, Auto} from "core/kinds"

const ZoomTogether = Enum("none", "cross", "all")
type ZoomTogether = typeof ZoomTogether["__type__"]

const Renderers = Or(Array(Ref(DataRenderer)), Auto)
type Renderers = typeof Renderers["__type__"]

export class WheelZoomToolView extends GestureToolView {
  declare model: WheelZoomTool

  override _scroll(ev: ScrollEvent): void {
    const {sx, sy, delta} = ev
    this.zoom(sx, sy, delta)
  }

  override _pinch(ev: PinchEvent): void {
    const {sx, sy, scale} = ev
    const delta = scale >= 1 ? (scale - 1)*20.0 : -20.0/scale
    this.zoom(sx, sy, delta)
  }

  zoom(sx: number, sy: number, delta: number): void {
    const axis_view = this.plot_view.axis_views.find((view) => view.bbox.contains(sx, sy))
    if (axis_view != null && !this.model.zoom_on_axis) {
      return
    }

    const {frame} = this.plot_view
    if (axis_view == null && !frame.bbox.contains(sx, sy)) {
      return
    }

    const [x_frame_scales_, y_frame_scales_] = (() => {
      const x_frame = [...frame.x_scales.values()]
      const y_frame = [...frame.y_scales.values()]

      if (axis_view == null) {
        return [x_frame, y_frame]
      } else {
        const {zoom_together} = this.model
        if (zoom_together == "all") {
          if (axis_view.dimension == 0) {
            return [x_frame, []]
          } else {
            return [[], y_frame]
          }
        } else {
          const {x_scale, y_scale} = axis_view.coordinates

          switch (zoom_together) {
            case "cross": {
              return [[x_scale], [y_scale]]
            }
            case "none": {
              if (axis_view.dimension == 0) {
                return [[x_scale], []]
              } else {
                return [[], [y_scale]]
              }
            }
          }
        }
      }
    })()

    const x_frame_scales = new Set(x_frame_scales_)
    const y_frame_scales = new Set(y_frame_scales_)

    const x_renderer_scales = new Set<Scale>()
    const y_renderer_scales = new Set<Scale>()

    const {renderers} = this.model
    const data_renderers = renderers != "auto" ? renderers : this.plot_view.model.data_renderers

    for (const renderer of data_renderers) {
      if (renderer.coordinates == null) {
        continue
      }

      const rv = this.plot_view.renderer_view(renderer)
      assert(rv != null)

      const {x_scale, y_scale} = rv.coordinates

      if (x_scale instanceof CompositeScale) {
        if (x_frame_scales.has(x_scale.target_scale)) {
          x_renderer_scales.add(x_scale)
        }
      }

      if (y_scale instanceof CompositeScale) {
        if (y_frame_scales.has(y_scale.target_scale)) {
          y_renderer_scales.add(y_scale)
        }
      }
    }

    const [x_all_scales, y_all_scales] = (() => {
      if (renderers == "auto") {
        return [
          new Set([...x_frame_scales, ...x_renderer_scales]),
          new Set([...y_frame_scales, ...y_renderer_scales]),
        ]
      } else {
        return [
          x_renderer_scales,
          y_renderer_scales,
        ]
      }
    })()

    const subcoord = {x: false, y: false}

    const traverse = (scale: Scale, dim: "x" | "y") => {
      const {level} = this.model
      for (let i = 0; i < level; i++) {
        if (scale instanceof CompositeScale) {
          subcoord[dim] = true
          scale = scale.source_scale
        } else {
          logger.warn(`can't reach sub-coordinate level ${level} for ${scale} in ${dim} dimension; stopped at ${i}`)
          break
        }
      }

      if (scale instanceof CompositeScale) {
        return scale.target_scale
      } else {
        return scale
      }
    }

    const x_scales = new Set<Scale>()
    const y_scales = new Set<Scale>()

    for (const x_scale of x_all_scales) {
      x_scales.add(traverse(x_scale, "x"))
    }
    for (const y_scale of y_all_scales) {
      y_scales.add(traverse(y_scale, "y"))
    }

    const center = (() => {
      const x = subcoord.x ? null : sx
      const y = subcoord.y ? null : sy

      if (axis_view != null) {
        return axis_view.dimension == 0 ? {x, y: null} : {x: null, y}
      } else {
        return {x, y}
      }
    })()

    // restrict to axis configured in tool's dimensions property and if
    // zoom origin is inside of frame range/domain
    const dims = this.model.dimensions
    const x_axis = dims == "width" || dims == "both"
    const y_axis = dims == "height" || dims == "both"

    const {x_target, y_target} = frame
    const factor = this.model.speed*delta

    const zoom_info = scale_range(x_scales, y_scales, x_target, y_target, factor, x_axis, y_axis, center)

    this.plot_view.state.push("wheel_zoom", {range: zoom_info})

    const {maintain_focus} = this.model
    this.plot_view.update_range(zoom_info, {scrolling: true, maintain_focus})

    this.model.document?.interactive_start(this.plot_view.model, () => this.plot_view.trigger_ranges_update_event())
  }
}

export namespace WheelZoomTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimensions: p.Property<Dimensions>
    renderers: p.Property<Renderers>
    level: p.Property<number>
    maintain_focus: p.Property<boolean>
    zoom_on_axis: p.Property<boolean>
    zoom_together: p.Property<ZoomTogether>
    speed: p.Property<number>
  }
}

export interface WheelZoomTool extends WheelZoomTool.Attrs {}

export class WheelZoomTool extends GestureTool {
  declare properties: WheelZoomTool.Props
  declare __view_type__: WheelZoomToolView

  constructor(attrs?: Partial<WheelZoomTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WheelZoomToolView

    this.define<WheelZoomTool.Props>(({Boolean, Number, NonNegative, Int}) => ({
      dimensions:     [ Dimensions, "both" ],
      renderers:      [ Renderers, "auto" ],
      level:          [ NonNegative(Int), 0 ],
      maintain_focus: [ Boolean, true ],
      zoom_on_axis:   [ Boolean, true ],
      zoom_together:  [ ZoomTogether, "all" ],
      speed:          [ Number, 1/600 ],
    }))

    this.register_alias("wheel_zoom", () => new WheelZoomTool({dimensions: "both"}))
    this.register_alias("xwheel_zoom", () => new WheelZoomTool({dimensions: "width"}))
    this.register_alias("ywheel_zoom", () => new WheelZoomTool({dimensions: "height"}))
  }

  override tool_name = "Wheel Zoom"
  override tool_icon = tool_icon_wheel_zoom
  override event_type = "scroll" as const
  override default_order = 10

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }
}
