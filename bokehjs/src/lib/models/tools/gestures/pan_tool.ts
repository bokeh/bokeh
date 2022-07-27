import {GestureTool, GestureToolView} from "./gesture_tool"
import * as p from "core/properties"
import {PanEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import {Interval} from "core/types"
import {Scale} from "models/scales/scale"
import * as icons from "styles/icons.css"

export function update_ranges(scales: Map<string, Scale>, p0: number, p1: number): Map<string, Interval> {
  const r: Map<string, Interval> = new Map()
  for (const [name, scale] of scales) {
    const [start, end] = scale.r_invert(p0, p1)
    r.set(name, {start, end})
  }
  return r
}

export class PanToolView extends GestureToolView {
  override model: PanTool

  protected last_dx: number
  protected last_dy: number

  protected v_axis_only: boolean
  protected h_axis_only: boolean

  protected pan_info?: {
    xrs: Map<string, Interval>
    yrs: Map<string, Interval>
    sdx: number
    sdy: number
  }

  override _pan_start(ev: PanEvent): void {
    this.last_dx = 0
    this.last_dy = 0
    const {sx, sy} = ev
    const bbox = this.plot_view.frame.bbox
    if (!bbox.contains(sx, sy)) {
      const hr = bbox.h_range
      const vr = bbox.v_range
      if (sx < hr.start || sx > hr.end)
        this.v_axis_only = true
      if (sy < vr.start || sy > vr.end)
        this.h_axis_only = true
    }

    this.model.document?.interactive_start(this.plot_view.model)
  }

  override _pan(ev: PanEvent): void {
    this._update(ev.deltaX, ev.deltaY)
    this.model.document?.interactive_start(this.plot_view.model)
  }

  override _pan_end(_e: PanEvent): void {
    this.h_axis_only = false
    this.v_axis_only = false

    if (this.pan_info != null)
      this.plot_view.state.push("pan", {range: this.pan_info})

    this.plot_view.trigger_ranges_update_event()
  }

  _update(dx: number, dy: number): void {
    const frame = this.plot_view.frame

    const new_dx = dx - this.last_dx
    const new_dy = dy - this.last_dy

    const hr = frame.bbox.h_range
    const sx_low  = hr.start - new_dx
    const sx_high = hr.end - new_dx

    const vr = frame.bbox.v_range
    const sy_low  = vr.start - new_dy
    const sy_high = vr.end - new_dy

    const dims = this.model.dimensions

    let sx0: number
    let sx1: number
    let sdx: number
    if ((dims == "width" || dims == "both") && !this.v_axis_only) {
      sx0 = sx_low
      sx1 = sx_high
      sdx = -new_dx
    } else {
      sx0 = hr.start
      sx1 = hr.end
      sdx = 0
    }

    let sy0: number
    let sy1: number
    let sdy: number
    if ((dims == "height" || dims == "both") && !this.h_axis_only) {
      sy0 = sy_low
      sy1 = sy_high
      sdy = -new_dy
    } else {
      sy0 = vr.start
      sy1 = vr.end
      sdy = 0
    }

    this.last_dx = dx
    this.last_dy = dy

    const {x_scales, y_scales} = frame
    const xrs = update_ranges(x_scales, sx0, sx1)
    const yrs = update_ranges(y_scales, sy0, sy1)

    this.pan_info = {xrs, yrs, sdx, sdy}
    this.plot_view.update_range(this.pan_info, {panning: true})
  }
}

export namespace PanTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimensions: p.Property<Dimensions>
  }
}

export interface PanTool extends PanTool.Attrs {}

export class PanTool extends GestureTool {
  override properties: PanTool.Props
  override __view_type__: PanToolView

  constructor(attrs?: Partial<PanTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PanToolView

    this.define<PanTool.Props>(() => ({
      dimensions: [ Dimensions, "both" ],
    }))

    this.register_alias("pan", () => new PanTool({dimensions: "both"}))
    this.register_alias("xpan", () => new PanTool({dimensions: "width"}))
    this.register_alias("ypan", () => new PanTool({dimensions: "height"}))
  }

  override tool_name = "Pan"
  override event_type = "pan" as "pan"
  override default_order = 10

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  override get computed_icon(): string {
    const {icon} = this
    if (icon != null)
      return icon
    else {
      switch (this.dimensions) {
        case "both":   return `.${icons.tool_icon_pan}`
        case "width":  return `.${icons.tool_icon_xpan}`
        case "height": return `.${icons.tool_icon_ypan}`
      }
    }
  }
}
