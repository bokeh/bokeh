import {GestureEvent} from "core/ui_events"
import {BoxAnnotation, EDGE_TOLERANCE} from "../../annotations/box_annotation"
import {Range} from "../../ranges/range"
import {Range1d} from "../../ranges/range1d"
import {Scale} from '../../scales/scale'
import {logger} from "core/logging"
import * as p from "core/properties"
import {GestureTool, GestureToolView} from "./gesture_tool"


const enum Side { None, Left, Right, LeftRight, Bottom, Top, BottomTop, LeftRightBottomTop }

// TODO (bev) This would be better directly with BoxAnnotation, but hard
// to test on a view. Move when "View Models" are implemented
export function is_near(pos: number, value: number|null, scale: Scale, tolerance: number): boolean {
  if (value == null)
    return false
  const svalue = scale.compute(value)
  return Math.abs(pos-svalue) < tolerance
}

// TODO (bev) This would be better directly with BoxAnnotation, but hard
// to test on a view. Move when "View Models" are implemented
export function is_inside(sx: number, sy: number, xscale: Scale, yscale: Scale, overlay: BoxAnnotation): boolean {
  let result = true

  if (overlay.left != null && overlay.right != null) {
    const x = xscale.invert(sx)
    if (x < overlay.left || x > overlay.right)
      result = false
  }

  if (overlay.bottom != null && overlay.top != null) {
    const y = yscale.invert(sy)
    if (y < overlay.bottom || y > overlay.top)
      result = false
  }

  return result
}

export function compute_value(value: number, scale: Scale, sdelta: number, range: Range): number {
  const svalue = scale.compute(value)
  const new_value = scale.invert(svalue+sdelta)
  if (new_value >= range.start && new_value <= range.end)
    return new_value
  return value
}

export function update_range(range: Range1d, scale: Scale, delta: number, plot_range: Range): void {
  const [sstart, send] = scale.r_compute(range.start, range.end)
  const [start, end] = scale.r_invert(sstart+delta, send+delta)
  if (start >= plot_range.start && start <= plot_range.end &&
      end >= plot_range.start && end <= plot_range.end) {
    range.start = start
    range.end = end
  }
}

export class RangeToolView extends GestureToolView {
  model: RangeTool

  private last_dx: number
  private last_dy: number
  private side: Side

  initialize(options: any): void {
    super.initialize(options)
    this.side = Side.None
    this.model.update_overlay_from_ranges()
  }

  connect_signals(): void {
    super.connect_signals()
    if (this.model.x_range != null)
      this.connect(this.model.x_range.change, () => this.model.update_overlay_from_ranges())
    if (this.model.y_range != null)
      this.connect(this.model.y_range.change, () => this.model.update_overlay_from_ranges())
  }

  _pan_start(ev: GestureEvent): void {
    this.last_dx = 0
    this.last_dy = 0

    const xr = this.model.x_range
    const yr = this.model.y_range

    const frame = this.plot_model.frame
    const xscale = frame.xscales.default
    const yscale = frame.yscales.default

    const overlay = this.model.overlay
    const {left, right, top, bottom} = overlay

    const tolerance = this.model.overlay.properties.line_width.value() + EDGE_TOLERANCE

    if (xr != null && this.model.x_interaction) {
      if (is_near(ev.sx, left, xscale, tolerance))
        this.side = Side.Left
      else if (is_near(ev.sx, right, xscale, tolerance))
        this.side = Side.Right
      else if (is_inside(ev.sx, ev.sy, xscale, yscale, overlay)) {
        this.side = Side.LeftRight
      }
    }

    if (yr != null && this.model.y_interaction) {
      if (this.side == Side.None && is_near(ev.sy, bottom, yscale, tolerance))
        this.side = Side.Bottom
      if (this.side == Side.None && is_near(ev.sy, top, yscale, tolerance))
        this.side = Side.Top
      else if (is_inside(ev.sx, ev.sy, xscale, yscale, this.model.overlay)) {
        if (this.side == Side.LeftRight)
          this.side = Side.LeftRightBottomTop
        else
          this.side = Side.BottomTop
      }
    }
  }

  _pan(ev: GestureEvent): void {
    const frame = this.plot_model.frame

    const new_dx = ev.deltaX - this.last_dx
    const new_dy = ev.deltaY - this.last_dy

    const xr = this.model.x_range
    const yr = this.model.y_range

    const xscale = frame.xscales.default
    const yscale = frame.yscales.default

    if (xr != null) {
      if (this.side == Side.LeftRight || this.side == Side.LeftRightBottomTop)
        update_range(xr, xscale, new_dx, frame.x_range)
      else if (this.side == Side.Left)
        xr.start = compute_value(xr.start, xscale, new_dx, frame.x_range)
      else if (this.side == Side.Right)
        xr.end = compute_value(xr.end, xscale, new_dx, frame.x_range)
    }

    if (yr != null) {
      if (this.side == Side.BottomTop || this.side == Side.LeftRightBottomTop)
        update_range(yr, yscale, new_dy, frame.y_range)
      else if (this.side == Side.Bottom)
        yr.start = compute_value(yr.start, yscale, new_dy, frame.y_range)
      else if (this.side == Side.Top)
        yr.end = compute_value(yr.end, yscale, new_dy, frame.y_range)
    }

    this.last_dx = ev.deltaX
    this.last_dy = ev.deltaY

  }

  _pan_end(_ev: GestureEvent): void {
    this.side = Side.None
  }

}

const DEFAULT_RANGE_OVERLAY = () => {
  return new BoxAnnotation({
    level: "overlay",
    render_mode: "css",
    fill_color: "lightgrey",
    fill_alpha: {value: 0.5},
    line_color: {value: "black"},
    line_alpha: {value: 1.0},
    line_width: {value: 0.5},
    line_dash: [2, 2],
  })
}

export namespace RangeTool {
  export interface Attrs extends GestureTool.Attrs {
    x_range: Range1d | null
    x_interaction: boolean
    y_range: Range1d | null
    y_interaction: boolean
    overlay: BoxAnnotation
  }

  export interface Props extends GestureTool.Props {}
}

export interface RangeTool extends RangeTool.Attrs {}

export class RangeTool extends GestureTool {

  properties: RangeTool.Props

  constructor(attrs?: Partial<RangeTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "RangeTool"
    this.prototype.default_view = RangeToolView

    this.define({
        x_range:       [ p.Instance, null                  ],
        x_interaction: [ p.Bool,     true                  ],
        y_range:       [ p.Instance, null                  ],
        y_interaction: [ p.Bool,     true                  ],
        overlay:       [ p.Instance, DEFAULT_RANGE_OVERLAY ],
    })

  }

  initialize(): void {
    super.initialize()
    this.overlay.in_cursor = "grab"
    this.overlay.ew_cursor = this.x_range != null && this.x_interaction ? "ew-resize" : null
    this.overlay.ns_cursor = this.y_range != null && this.y_interaction ? "ns-resize" : null
  }

  update_overlay_from_ranges(): void {
    if (this.x_range == null && this.y_range == null) {
      this.overlay.left = null
      this.overlay.right = null
      this.overlay.bottom = null
      this.overlay.top = null
      logger.warn('RangeTool not configured with any Ranges.')
    }

    if (this.x_range == null) {
      this.overlay.left = null
      this.overlay.right = null
    }
    else {
      this.overlay.left = this.x_range.start
      this.overlay.right = this.x_range.end
    }

    if (this.y_range == null) {
      this.overlay.bottom = null
      this.overlay.top = null
    }
    else {
      this.overlay.bottom = this.y_range.start
      this.overlay.top = this.y_range.end
    }
  }

  tool_name = "Range Tool"
  icon = "bk-tool-icon-range"
  event_type = "pan" as "pan"
  default_order = 1
}
RangeTool.initClass()
