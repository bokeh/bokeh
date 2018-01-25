import {GestureTool, GestureToolView} from "./gesture_tool"
import {scale_range} from "core/util/zoom"
import * as p from "core/properties"
import {Dimensions} from "core/enums"

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
    delta: number
  }
  scale: number
}

export class WheelZoomToolView extends GestureToolView {
  model: WheelZoomTool

  _pinch(e: BkEv): void {
    // TODO (bev) this can probably be done much better
    let delta: number
    if (e.scale >= 1)
      delta = (e.scale - 1) * 20.0
    else
      delta = -20.0/e.scale
    e.bokeh.delta = delta
    this._scroll(e)
  }

  _scroll(e: BkEv): void {
    const frame = this.plot_model.frame

    const hr = frame.bbox.h_range
    const vr = frame.bbox.v_range

    const {sx, sy} = e.bokeh
    const dims = this.model.dimensions

    // restrict to axis configured in tool's dimensions property and if
    // zoom origin is inside of frame range/domain
    const h_axis = (dims == 'width' || dims == 'both') && hr.start < sx && sx < hr.end
    const v_axis = (dims == 'height' || dims == 'both') && vr.start < sy && sy < vr.end

    const factor = this.model.speed*e.bokeh.delta

    const zoom_info = scale_range(frame, factor, h_axis, v_axis, {x: sx, y: sy})

    this.plot_view.push_state('wheel_zoom', {range: zoom_info})
    this.plot_view.update_range(zoom_info, false, true)

    if (this.model.document != null)
      this.model.document.interactive_start(this.plot_model.plot)
  }
}

const is_mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

export namespace WheelZoomTool {
  export interface Attrs extends GestureTool.Attrs {
    dimensions: Dimensions
    speed: number
  }
}

export interface WheelZoomTool extends GestureTool, WheelZoomTool.Attrs {}

export class WheelZoomTool extends GestureTool {

  static initClass() {
    this.prototype.type = "WheelZoomTool"

    this.prototype.default_view = WheelZoomToolView

    this.define({
      dimensions: [ p.Dimensions, "both" ],
    })

    this.internal({
      speed: [ p.Number, 1/600 ],
    })
  }

  tool_name = "Wheel Zoom"
  icon = "bk-tool-icon-wheel-zoom"
  event_type = is_mobile ? 'pinch' : 'scroll'
  default_order = 10

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}

WheelZoomTool.initClass()
