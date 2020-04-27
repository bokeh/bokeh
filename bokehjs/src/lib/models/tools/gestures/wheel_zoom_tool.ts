import {GestureTool, GestureToolView} from "./gesture_tool"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"
import {PinchEvent, ScrollEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import {is_mobile} from "core/util/compat"
import {bk_tool_icon_wheel_zoom} from "styles/icons"

export class WheelZoomToolView extends GestureToolView {
  model: WheelZoomTool

  _pinch(ev: PinchEvent): void {
    // TODO (bev) this can probably be done much better
    const {sx, sy, scale, ctrlKey, shiftKey} = ev

    let delta: number
    if (scale >= 1)
      delta = (scale - 1) * 20.0
    else
      delta = -20.0/scale

    this._scroll({type: "wheel", sx, sy, delta, ctrlKey, shiftKey})
  }

  _scroll(ev: ScrollEvent): void {
    const {frame} = this.plot_view

    const hr = frame.bbox.h_range
    const vr = frame.bbox.v_range

    const {sx, sy} = ev
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property and if
    // zoom origin is inside of frame range/domain
    const h_axis = (dims == 'width' || dims == 'both') && hr.start < sx && sx < hr.end
    const v_axis = (dims == 'height' || dims == 'both') && vr.start < sy && sy < vr.end

    if ((!h_axis || !v_axis) && !this.model.zoom_on_axis) {
      return
    }

    const factor = this.model.speed*ev.delta

    const zoom_info = scale_range(frame, factor, h_axis, v_axis, {x: sx, y: sy})

    this.plot_view.push_state('wheel_zoom', {range: zoom_info})
    this.plot_view.update_range(zoom_info, false, true, this.model.maintain_focus)

    this.plot_view.canvas_view.interactive_start(this.plot_model)
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
  properties: WheelZoomTool.Props
  __view_type__: WheelZoomToolView

  constructor(attrs?: Partial<WheelZoomTool.Attrs>) {
    super(attrs)
  }

  static init_WheelZoomTool(): void {
    this.prototype.default_view = WheelZoomToolView

    this.define<WheelZoomTool.Props>({
      dimensions:     [ p.Dimensions, "both" ],
      maintain_focus: [ p.Boolean,    true   ],
      zoom_on_axis:   [ p.Boolean,    true   ],
      speed:          [ p.Number,     1/600  ],
    })

    this.register_alias("wheel_zoom", () => new WheelZoomTool({dimensions: 'both'}))
    this.register_alias("xwheel_zoom", () => new WheelZoomTool({dimensions: 'width'}))
    this.register_alias("ywheel_zoom", () => new WheelZoomTool({dimensions: 'height'}))
  }

  tool_name = "Wheel Zoom"
  icon = bk_tool_icon_wheel_zoom
  event_type = is_mobile ? "pinch" as "pinch" : "scroll" as "scroll"
  default_order = 10

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}
