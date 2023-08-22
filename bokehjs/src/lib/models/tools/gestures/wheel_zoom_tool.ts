import {GestureTool, GestureToolView} from "./gesture_tool"
import {scale_range} from "core/util/zoom"
import type * as p from "core/properties"
import type {PinchEvent, ScrollEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import {is_mobile} from "core/util/platform"
import {tool_icon_wheel_zoom} from "styles/icons.css"
import {Enum} from "../../../core/kinds"

const ZoomTogether = Enum("none", "cross", "all")
type ZoomTogether = typeof ZoomTogether["__type__"]

export class WheelZoomToolView extends GestureToolView {
  declare model: WheelZoomTool

  override _pinch(ev: PinchEvent): void {
    // TODO (bev) this can probably be done much better
    const {sx, sy, scale, modifiers} = ev

    let delta: number
    if (scale >= 1)
      delta = (scale - 1)*20.0
    else
      delta = -20.0/scale

    this._scroll({type: "wheel", sx, sy, delta, modifiers})
  }

  override _scroll(ev: ScrollEvent): void {
    const {sx, sy} = ev

    const axis_view = this.plot_view.axis_views.find((view) => view.layout.bbox.contains(sx, sy))
    if (axis_view != null && !this.model.zoom_on_axis) {
      return
    }

    const {frame} = this.plot_view
    if (axis_view == null && !frame.bbox.contains(sx, sy)) {
      return
    }

    // restrict to axis configured in tool's dimensions property and if
    // zoom origin is inside of frame range/domain
    const dims = this.model.dimensions
    const x_axis = dims == "width" || dims == "both"
    const y_axis = dims == "height" || dims == "both"

    const {x_target, y_target} = frame
    const {x_scales, y_scales, center} = (() => {
      if (axis_view != null) {
        const center = axis_view.dimension == 0 ? {x: sx, y: null} : {x: null, y: sy}

        const {zoom_together} = this.model
        if (zoom_together == "all") {
          const {x_scales, y_scales} = frame
          if (axis_view.dimension == 0)
            return {x_scales, y_scales: new Map(), center}
          else
            return {x_scales: new Map(), y_scales, center}
        } else {
          const {x_range_name, y_range_name} = axis_view.model
          const {x_scale, y_scale} = axis_view.coordinates

          const x_scales = new Map([[x_range_name, x_scale]])
          const y_scales = new Map([[y_range_name, y_scale]])

          switch (zoom_together) {
            case "cross": {
              return {x_scales, y_scales, center}
            }
            case "none": {
              if (axis_view.dimension == 0)
                return {x_scales, y_scales: new Map(), center}
              else
                return {x_scales: new Map(), y_scales, center}
            }
          }
        }
      } else {
        const {x_scales, y_scales} = frame
        return {x_scales, y_scales, center: {x: sx, y: sy}}
      }
    })()

    const x_scales_ = [...x_scales.values()]
    const y_scales_ = [...y_scales.values()]

    const factor = this.model.speed*ev.delta
    const zoom_info = scale_range(x_scales_, y_scales_, x_target, y_target, factor, x_axis, y_axis, center)

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

    this.define<WheelZoomTool.Props>(({Boolean, Number}) => ({
      dimensions:     [ Dimensions, "both" ],
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
  override event_type = is_mobile ? "pinch" as "pinch" : "scroll" as "scroll"
  override default_order = 10

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }
}
