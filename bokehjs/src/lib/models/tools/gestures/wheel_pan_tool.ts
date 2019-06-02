import {GestureTool, GestureToolView} from "./gesture_tool"
import * as p from "core/properties"
import {ScrollEvent} from "core/ui_events"
import {Dimension} from "core/enums"
import {bk_tool_icon_wheel_pan} from "styles/icons"

export class WheelPanToolView extends GestureToolView {
  model: WheelPanTool

  _scroll(ev: ScrollEvent): void {
    let factor = this.model.speed*ev.delta

    // clamp the magnitude of factor, if it is > 1 bad things happen
    if (factor > 0.9)
      factor = 0.9
    else if (factor < -0.9)
      factor = -0.9

    this._update_ranges(factor)
  }

  _update_ranges(factor: number): void {
    const {frame} = this.plot_view

    const hr = frame.bbox.h_range
    const vr = frame.bbox.v_range

    const [sx_low, sx_high] = [hr.start, hr.end]
    const [sy_low, sy_high] = [vr.start, vr.end]

    let sx0: number
    let sx1: number
    let sy0: number
    let sy1: number

    switch (this.model.dimension) {
      case "height": {
        const sy_range = Math.abs(sy_high - sy_low)
        sx0 = sx_low
        sx1 = sx_high
        sy0 = sy_low - sy_range * factor
        sy1 = sy_high - sy_range * factor
        break
      }
      case "width": {
        const sx_range = Math.abs(sx_high - sx_low)
        sx0 = sx_low - sx_range * factor
        sx1 = sx_high - sx_range * factor
        sy0 = sy_low
        sy1 = sy_high
        break
      }
      default:
        throw new Error("this shouldn't have happened")
    }

    // OK this sucks we can't set factor independently in each direction. It is used
    // for GMap plots, and GMap plots always preserve aspect, so effective the value
    // of 'dimensions' is ignored.
    const pan_info = {sxr: {sx0, sx1}, syr: {sy0, sy1}, factor}
    const range_info = this.plot_view.update_range_from_screen(pan_info, false, true)
    if (range_info != null)
      this.plot_view.push_state('wheel_pan', {range: range_info})

    if (this.model.document != null)
      this.model.document.interactive_start(this.plot_model)
  }
}

export namespace WheelPanTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimension: p.Property<Dimension>
    speed: p.Property<number>
  }
}

export interface WheelPanTool extends WheelPanTool.Attrs {}

export class WheelPanTool extends GestureTool {
  properties: WheelPanTool.Props

  constructor(attrs?: Partial<WheelPanTool.Attrs>) {
    super(attrs)
  }

  static init_WheelPanTool(): void {
    this.prototype.default_view = WheelPanToolView

    this.define<WheelPanTool.Props>({
      dimension: [ p.Dimension, "width" ],
    })

    this.internal({
      speed: [ p.Number, 1/1000 ],
    })
  }

  tool_name = "Wheel Pan"
  icon = bk_tool_icon_wheel_pan
  event_type = "scroll" as "scroll"
  default_order = 12

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimension)
  }
}
