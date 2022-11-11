import {GestureTool, GestureToolView} from "./gesture_tool"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"
import {PinchEvent, ScrollEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import {is_mobile} from "core/util/platform"
import {tool_icon_wheel_zoom} from "styles/icons.css"

export class WheelZoomToolView extends GestureToolView {
  declare model: WheelZoomTool

  override _pinch(ev: PinchEvent): void {
    // TODO (bev) this can probably be done much better
    const {sx, sy, scale, shift_key, ctrl_key, alt_key} = ev

    let delta: number
    if (scale >= 1)
      delta = (scale - 1) * 20.0
    else
      delta = -20.0/scale

    this._scroll({type: "wheel", sx, sy, delta, shift_key, ctrl_key, alt_key})
  }

  override _scroll(ev: ScrollEvent): void {
    const {frame} = this.plot_view

    const hr = frame.bbox.h_range
    const vr = frame.bbox.v_range

    const {sx, sy} = ev
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property and if
    // zoom origin is inside of frame range/domain
    const h_axis = (dims == "width" || dims == "both") && hr.start < sx && sx < hr.end
    const v_axis = (dims == "height" || dims == "both") && vr.start < sy && sy < vr.end

    if ((!h_axis || !v_axis) && !this.model.zoom_on_axis) {
      return
    }

    const factor = this.model.speed*ev.delta

    const zoom_info = scale_range(frame, factor, h_axis, v_axis, {x: sx, y: sy})

    this.plot_view.state.push("wheel_zoom", {range: zoom_info})

    const {maintain_focus} = this.model
    this.plot_view.update_range(zoom_info, {scrolling: true, maintain_focus})

    this.model.document?.interactive_start(this.plot_view.model, () =>  this.plot_view.trigger_ranges_update_event())
  }
}

export namespace WheelZoomTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimensions: p.Property<Dimensions>
    maintain_focus: p.Property<boolean>
    zoom_on_axis: p.Property<boolean>
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
