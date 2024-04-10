import {GestureTool, GestureToolView} from "./gesture_tool"
import {Modifiers, satisfies_modifiers, print_modifiers} from "./common"
import type * as p from "core/properties"
import type {ScrollEvent} from "core/ui_events"
import {Dimension} from "core/enums"
import {clamp} from "core/util/math"
import {tool_icon_wheel_pan} from "styles/icons.css"
import {update_ranges} from "./pan_tool"

export class WheelPanToolView extends GestureToolView {
  declare model: WheelPanTool

  override _scroll(ev: ScrollEvent): boolean {
    const {modifiers} = this.model
    if (!satisfies_modifiers(modifiers, ev.modifiers)) {
      this.plot_view.notify_about(`use ${print_modifiers(modifiers)} + scroll to pan`)
      return false
    }

    // clamp the magnitude of factor, if it is > 1 bad things happen
    const factor = clamp(this.model.speed*ev.delta, -0.9, 0.9)
    this._update_ranges(factor)

    return true
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
    }

    const {x_scales, y_scales} = frame
    const xrs = update_ranges(x_scales, sx0, sx1)
    const yrs = update_ranges(y_scales, sy0, sy1)

    // OK this sucks we can't set factor independently in each direction. It is used
    // for GMap plots, and GMap plots always preserve aspect, so effective the value
    // of 'dimensions' is ignored.
    const pan_info = {xrs, yrs, factor}
    this.plot_view.state.push("wheel_pan", {range: pan_info})
    this.plot_view.update_range(pan_info, {scrolling: true})

    this.model.document?.interactive_start(this.plot_view.model, () => this.plot_view.trigger_ranges_update_event())
  }
}

export namespace WheelPanTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimension: p.Property<Dimension>
    modifiers: p.Property<Modifiers>
    speed: p.Property<number>
  }
}

export interface WheelPanTool extends WheelPanTool.Attrs {}

export class WheelPanTool extends GestureTool {
  declare properties: WheelPanTool.Props
  declare __view_type__: WheelPanToolView

  constructor(attrs?: Partial<WheelPanTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WheelPanToolView

    this.define<WheelPanTool.Props>(() => ({
      dimension: [ Dimension, "width" ],
      modifiers: [ Modifiers, {} ],
    }))

    this.internal<WheelPanTool.Props>(({Float}) => ({
      speed: [ Float, 1/1000 ],
    }))

    this.register_alias("xwheel_pan", () => new WheelPanTool({dimension: "width"}))
    this.register_alias("ywheel_pan", () => new WheelPanTool({dimension: "height"}))
  }

  override tool_name = "Wheel Pan"
  override tool_icon = tool_icon_wheel_pan
  override event_type = "scroll" as "scroll"
  override default_order = 12

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimension)
  }

  override supports_auto(): boolean {
    const {alt, ctrl, shift} = this.modifiers
    return alt != null || ctrl != null || shift != null
  }
}
