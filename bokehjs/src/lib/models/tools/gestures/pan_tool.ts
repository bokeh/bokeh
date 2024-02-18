import {GestureTool, GestureToolView} from "./gesture_tool"
import type {RangeInfo, RangeState} from "../../plots/range_manager"
import type * as p from "core/properties"
import type {PanEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import type {MenuItem} from "core/util/menus"
import type {Scale} from "models/scales/scale"
import * as icons from "styles/icons.css"

export function update_ranges(scales: Map<string, Scale>, p0: number, p1: number): RangeState {
  const r: RangeState = new Map()
  for (const [, scale] of scales) {
    const [start, end] = scale.r_invert(p0, p1)
    r.set(scale.source_range, {start, end})
  }
  return r
}

export class PanToolView extends GestureToolView {
  declare model: PanTool

  protected last_dx: number
  protected last_dy: number

  protected v_axis_only: boolean
  protected h_axis_only: boolean

  protected pan_info?: RangeInfo & {
    sdx: number
    sdy: number
  }

  override cursor(sx: number, sy: number): string | null {
    const axis_view = this.plot_view.axis_views.find((view) => view.bbox.contains(sx, sy))
    if (axis_view != null) {
      switch (axis_view.dimension) {
        case 0: return "ew-resize"
        case 1: return "ns-resize"
      }
    } else if (this.plot_view.frame.bbox.contains(sx, sy)) {
      return "move"
    } else {
      return super.cursor(sx, sy)
    }
  }

  override _pan_start(ev: PanEvent): void {
    this.last_dx = 0
    this.last_dy = 0
    const {sx, sy} = ev
    const bbox = this.plot_view.frame.bbox
    if (!bbox.contains(sx, sy)) {
      const hr = bbox.h_range
      const vr = bbox.v_range
      if (sx < hr.start || sx > hr.end) {
        this.v_axis_only = true
      }
      if (sy < vr.start || sy > vr.end) {
        this.h_axis_only = true
      }
    }

    this.model.document?.interactive_start(this.plot_view.model)
  }

  override _pan(ev: PanEvent): void {
    this._update(ev.dx, ev.dy)
    this.model.document?.interactive_start(this.plot_view.model)
  }

  override _pan_end(_e: PanEvent): void {
    this.h_axis_only = false
    this.v_axis_only = false

    if (this.pan_info != null) {
      this.plot_view.state.push("pan", {range: this.pan_info})
    }

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
  declare properties: PanTool.Props
  declare __view_type__: PanToolView

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
    const icon = super.computed_icon
    if (icon != null) {
      return icon
    } else {
      switch (this.dimensions) {
        case "both":   return `.${icons.tool_icon_pan}`
        case "width":  return `.${icons.tool_icon_x_pan}`
        case "height": return `.${icons.tool_icon_y_pan}`
      }
    }
  }

  override get menu(): MenuItem[] | null {
    return [
      {
        icon: icons.tool_icon_pan,
        tooltip: "Pan in both dimensions",
        active: () => this.dimensions == "both",
        handler: () => {
          this.dimensions = "both"
          this.active = true
        },
      }, {
        icon: icons.tool_icon_x_pan,
        tooltip: "Pan in x-dimension",
        active: () => this.dimensions == "width",
        handler: () => {
          this.dimensions = "width"
          this.active = true
        },
      }, {
        icon: icons.tool_icon_y_pan,
        tooltip: "Pan in y-dimension",
        active: () => this.dimensions == "height",
        handler: () => {
          this.dimensions = "height"
          this.active = true
        },
      },
    ]
  }
}
