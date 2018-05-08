import {GestureTool, GestureToolView} from "./gesture_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import {CartesianFrame} from "../../canvas/cartesian_frame"
import * as p from "core/properties"
import {GestureEvent} from "core/ui_events"
import {Dimensions} from "core/enums"

export class BoxZoomToolView extends GestureToolView {
  model: BoxZoomTool

  protected _base_point: [number, number] | null

  _match_aspect(base_point: [number, number], curpoint: [number, number],
                frame: CartesianFrame): [[number, number], [number, number]] {
    // aspect ratio of plot frame
    const a = frame.bbox.aspect
    const hend = frame.bbox.h_range.end
    const hstart = frame.bbox.h_range.start
    const vend = frame.bbox.v_range.end
    const vstart = frame.bbox.v_range.start

    // current aspect of cursor-defined box
    let vw = Math.abs(base_point[0]-curpoint[0])
    let vh = Math.abs(base_point[1]-curpoint[1])

    const va = vh == 0 ? 0 : vw/vh
    const [xmod,] = va >= a ? [1, va/a] : [a/va, 1]

    // OK the code blocks below merit some explanation. They do:
    //
    // compute left/right, pin to frame if necessary
    // compute top/bottom (based on new left/right), pin to frame if necessary
    // recompute left/right (based on top/bottom), in case top/bottom were pinned

    // base_point[0] is left
    let left: number
    let right: number
    if (base_point[0] <= curpoint[0]) {
      left = base_point[0]
      right = base_point[0] + vw * xmod
      if (right > hend)
        right = hend
    // base_point[0] is right
    } else {
      right = base_point[0]
      left = base_point[0] - vw * xmod
      if (left < hstart)
        left = hstart
    }

    vw = Math.abs(right - left)

    // base_point[1] is bottom
    let top: number
    let bottom: number
    if (base_point[1] <= curpoint[1]) {
      bottom = base_point[1]
      top = base_point[1] + vw/a
      if (top > vend)
        top = vend
    // base_point[1] is top
    } else {
      top = base_point[1]
      bottom = base_point[1] - vw/a
      if (bottom < vstart)
        bottom = vstart
    }

    vh = Math.abs(top - bottom)

    // base_point[0] is left
    if (base_point[0] <= curpoint[0])
      right = base_point[0] + a*vh
    // base_point[0] is right
    else
      left = base_point[0] - a*vh

    return [[left, right], [bottom, top]]
  }

  protected _compute_limits(curpoint: [number, number]): [[number, number], [number, number]] {
    const frame = this.plot_model.frame
    const dims = this.model.dimensions

    let base_point = this._base_point!
    if (this.model.origin == "center") {
      const [cx, cy] = base_point
      const [dx, dy] = curpoint
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    let sx: [number, number]
    let sy: [number, number]
    if (this.model.match_aspect && dims == 'both')
      [sx, sy] = this._match_aspect(base_point, curpoint, frame)
    else
      [sx, sy] = this.model._get_dim_limits(base_point, curpoint, frame, dims)

    return [sx, sy]
  }

  _pan_start(ev: GestureEvent): void {
    this._base_point = [ev.sx, ev.sy]
  }

  _pan(ev: GestureEvent): void {
    const curpoint: [number, number] = [ev.sx, ev.sy]
    const [sx, sy] = this._compute_limits(curpoint)
    this.model.overlay.update({left: sx[0], right: sx[1], top: sy[0], bottom: sy[1]})
  }

  _pan_end(ev: GestureEvent): void {
    const curpoint: [number, number] = [ev.sx, ev.sy]
    const [sx, sy] = this._compute_limits(curpoint)
    this._update(sx, sy)

    this.model.overlay.update({left: null, right: null, top: null, bottom: null})
    this._base_point = null
  }

  _update([sx0, sx1]: [number, number], [sy0, sy1]: [number, number]): void {
    // If the viewing window is too small, no-op: it is likely that the user did
    // not intend to make this box zoom and instead was trying to cancel out of the
    // zoom, a la matplotlib's ToolZoom. Like matplotlib, set the threshold at 5 pixels.
    if (Math.abs(sx1 - sx0) <= 5 || Math.abs(sy1 - sy0) <= 5)
      return

    const {xscales, yscales} = this.plot_model.frame

    const xrs: {[key: string]: {start: number, end: number}} = {}
    for (const name in xscales) {
      const scale = xscales[name]
      const [start, end] = scale.r_invert(sx0, sx1)
      xrs[name] = {start: start, end: end}
    }

    const yrs: {[key: string]: {start: number, end: number}} = {}
    for (const name in yscales) {
      const scale = yscales[name]
      const [start, end] = scale.r_invert(sy0, sy1)
      yrs[name] = {start: start, end: end}
    }

    const zoom_info = {
      xrs: xrs,
      yrs: yrs,
    }

    this.plot_view.push_state('box_zoom', {range: zoom_info})
    this.plot_view.update_range(zoom_info)
  }
}

const DEFAULT_BOX_OVERLAY = () => {
  return new BoxAnnotation({
    level: "overlay",
    render_mode: "css",
    top_units: "screen",
    left_units: "screen",
    bottom_units: "screen",
    right_units: "screen",
    fill_color: {value: "lightgrey"},
    fill_alpha: {value: 0.5},
    line_color: {value: "black"},
    line_alpha: {value: 1.0},
    line_width: {value: 2},
    line_dash: {value: [4, 4]},
  })
}

export namespace BoxZoomTool {
  export interface Attrs extends GestureTool.Attrs {
    dimensions: Dimensions
    overlay: BoxAnnotation
    match_aspect: boolean
    origin: "corner" | "center"
  }

  export interface Props extends GestureTool.Props {}
}

export interface BoxZoomTool extends BoxZoomTool.Attrs {}

export class BoxZoomTool extends GestureTool {

  properties: BoxZoomTool.Props

  constructor(attrs?: Partial<BoxZoomTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "BoxZoomTool"
    this.prototype.default_view = BoxZoomToolView

    this.define({
      dimensions:   [ p.Dimensions, "both"            ],
      overlay:      [ p.Instance, DEFAULT_BOX_OVERLAY ],
      match_aspect: [ p.Bool,     false               ],
      origin:       [ p.String,   "corner"            ], // Enum
    })
  }

  tool_name = "Box Zoom"
  icon = "bk-tool-icon-box-zoom"
  event_type = "pan" as "pan"
  default_order = 20

  get tooltip(): string {
    return this._get_dim_tooltip(this.tool_name, this.dimensions)
  }
}

BoxZoomTool.initClass()
