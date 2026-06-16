import {GestureTool, GestureToolView} from "./gesture_tool"
import type {RangeInfo, RangeState} from "../../plots/range_manager"
import {MenuItem} from "../../ui/menus"
import type {MenuItemLike} from "../../ui/menus"
import type {IconLike} from "../../common/kinds"
import type * as p from "core/properties"
import type {PanEvent} from "core/ui_events"
import {assert} from "core/util/assert"
import {Dimensions} from "core/enums"
import type {SXY} from "core/util/bbox"
import type {Scale} from "models/scales/scale"
import * as icons from "styles/icons.css"
import {Enum} from "core/kinds"

const PanTogether = Enum("none", "cross", "all")
type PanTogether = typeof PanTogether["__type__"]

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

  protected pan_info?: RangeInfo & {
    sdx: number
    sdy: number
  }

  protected state: {
    last_dx: number
    last_dy: number
    dims: Dimensions
    axis_coords?: {x_scale: Scale, y_scale: Scale}
  } | null = null

  override cursor(sx: number, sy: number): string | null {
    if (this.state != null) {
      const {dims} = this.state
      switch (dims == "both" ? this.model.dimensions : dims) {
        case "both":   return "move"
        case "width":  return "ew-resize"
        case "height": return "ns-resize"
      }
    }
    return super.cursor(sx, sy)
  }

  protected _interactive_dims({sx, sy}: SXY): {dims: Dimensions, axis_coords?: {x_scale: Scale, y_scale: Scale}} | null {
    const {dimensions} = this.model
    const {plot_view} = this
    const axis_view = plot_view.axis_views.find((view) => view.bbox.contains(sx, sy))
    if (axis_view != null) {
      switch (axis_view.dimension) {
        case 0: {
          if (dimensions == "width" || dimensions == "both") {
            const {x_scale, y_scale} = axis_view.coordinates
            return {dims: "width", axis_coords: {x_scale, y_scale}}
          }
          break
        }
        case 1: {
          if (dimensions == "height" || dimensions == "both") {
            const {x_scale, y_scale} = axis_view.coordinates
            return {dims: "height", axis_coords: {x_scale, y_scale}}
          }
          break
        }
      }
    } else if (plot_view.frame.bbox.contains(sx, sy)) {
      return {dims: "both"}
    }

    return null
  }

  override _pan_start(ev: PanEvent): void {
    assert(this.state == null)

    const {sx, sy} = ev
    const result = this._interactive_dims({sx, sy})
    if (result != null) {
      const {dims, axis_coords} = result
      this.state = {last_dx: 0, last_dy: 0, dims, axis_coords}
      this.model.document?.interactive_start(this.plot_view.model)
    }
  }

  override _pan(ev: PanEvent): void {
    if (this.state != null) {
      this._update(ev.dx, ev.dy)
      this.model.document?.interactive_start(this.plot_view.model)
    }
  }

  override _pan_end(_e: PanEvent): void {
    if (this.state != null) {
      this.state = null

      if (this.pan_info != null) {
        this.plot_view.state.push("pan", {range: this.pan_info})
      }

      this.plot_view.trigger_ranges_update_event()
    }
  }

  _update(dx: number, dy: number): void {
    const {state} = this
    assert(state != null)

    const frame = this.plot_view.frame

    const new_dx = dx - state.last_dx
    const new_dy = dy - state.last_dy

    const hr = frame.bbox.h_range
    const sx_low  = hr.start - new_dx
    const sx_high = hr.end - new_dx

    const vr = frame.bbox.v_range
    const sy_low  = vr.start - new_dy
    const sy_high = vr.end - new_dy

    const dims = this.model.dimensions
    const {x_scales, y_scales} = frame

    let sdx: number
    let xrs: RangeState
    let sdy: number
    let yrs: RangeState

    const {axis_coords} = state
    if (axis_coords == null) {
      // Gesture started inside the plot frame: pan all axes as constrained by `dims`.
      // Here we are a bit careful to only update the range info for dimensions that
      // are "in play". This is to avoid superfluous noise updates to dataranges that
      // would cause windowed auto-ranging to turn off.
      if (dims == "width" || dims == "both") {
        sdx = -new_dx
        xrs = update_ranges(x_scales, sx_low, sx_high)
      } else {
        sdx = 0
        xrs = new Map()
      }
      if (dims == "height" || dims == "both") {
        sdy = -new_dy
        yrs = update_ranges(y_scales, sy_low, sy_high)
      } else {
        sdy = 0
        yrs = new Map()
      }
    } else {
      // Gesture started on an axis: apply pan_together to select which scales move.
      const {pan_together} = this.model
      const {x_scale, y_scale} = axis_coords
      const x_axis_only = state.dims == "width"

      if (pan_together == "all") {
        // Pan all axes in the same dimension as the interacted axis only.
        if (x_axis_only) {
          sdx = -new_dx
          xrs = update_ranges(x_scales, sx_low, sx_high)
          sdy = 0
          yrs = new Map()
        } else {
          sdx = 0
          xrs = new Map()
          sdy = -new_dy
          yrs = update_ranges(y_scales, sy_low, sy_high)
        }
      } else if (pan_together == "cross") {
        // Pan only the interacted axis and its cross axis.
        sdx = -new_dx
        xrs = update_ranges(new Map([["x", x_scale]]), sx_low, sx_high)
        sdy = -new_dy
        yrs = update_ranges(new Map([["y", y_scale]]), sy_low, sy_high)
      } else {
        // "none": pan only the specific interacted axis.
        if (x_axis_only) {
          sdx = -new_dx
          xrs = update_ranges(new Map([["x", x_scale]]), sx_low, sx_high)
          sdy = 0
          yrs = new Map()
        } else {
          sdx = 0
          xrs = new Map()
          sdy = -new_dy
          yrs = update_ranges(new Map([["y", y_scale]]), sy_low, sy_high)
        }
      }

      // Respect the model-level `dimensions` constraint even on axis gestures.
      if (dims == "height") { sdx = 0; xrs = new Map() }
      if (dims == "width")  { sdy = 0; yrs = new Map() }
    }

    state.last_dx = dx
    state.last_dy = dy

    this.pan_info = {xrs, yrs, sdx, sdy}
    this.plot_view.update_range(this.pan_info, {panning: true})
  }
}

export namespace PanTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimensions: p.Property<Dimensions>
    pan_together: p.Property<PanTogether>
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
      dimensions:   [ Dimensions,   "both" ],
      pan_together: [ PanTogether,  "all"  ],
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

  override get computed_icon(): IconLike {
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

  override get menu(): MenuItemLike[] {
    return [
      new MenuItem({
        icon: `.${icons.tool_icon_pan}`,
        label: "XY mode",
        tooltip: "Pan in both dimensions",
        checked: () => this.dimensions == "both",
        action: () => {
          this.dimensions = "both"
          this.active = true
        },
      }),
      new MenuItem({
        icon: `.${icons.tool_icon_x_pan}`,
        label: "X-only",
        tooltip: "Pan in x-dimension",
        checked: () => this.dimensions == "width",
        action: () => {
          this.dimensions = "width"
          this.active = true
        },
      }),
      new MenuItem({
        icon: `.${icons.tool_icon_y_pan}`,
        label: "Y-only",
        tooltip: "Pan in y-dimension",
        checked: () => this.dimensions == "height",
        action: () => {
          this.dimensions = "height"
          this.active = true
        },
      }),
    ]
  }
}
