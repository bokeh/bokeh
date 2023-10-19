import type {EventRole} from "../tool"
import {GestureTool, GestureToolView} from "./gesture_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import type {CartesianFrame} from "../../canvas/cartesian_frame"
import type {RangeState} from "../../plots/range_manager"
import type * as p from "core/properties"
import type {PanEvent, KeyEvent, TapEvent} from "core/ui_events"
import {Dimensions, BoxOrigin} from "core/enums"
import type {MenuItem} from "core/util/menus"
import * as icons from "styles/icons.css"

type Point = [number, number]

export class BoxZoomToolView extends GestureToolView {
  declare model: BoxZoomTool

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

  protected _base_point: Point | null = null

  _match_aspect([bx, by]: Point, [cx, cy]: Point, frame: CartesianFrame): [Point, Point] {
    // aspect ratio of plot frame
    const a = frame.bbox.aspect
    const hend = frame.bbox.h_range.end
    const hstart = frame.bbox.h_range.start
    const vend = frame.bbox.v_range.end
    const vstart = frame.bbox.v_range.start

    // current aspect of cursor-defined box
    let vw = Math.abs(bx - cx)
    let vh = Math.abs(by - cy)

    const va = vh == 0 ? 0 : vw/vh
    const [xmod] = va >= a ? [1, va/a] : [a/va, 1]

    // OK the code blocks below merit some explanation. They do:
    //
    // compute left/right, pin to frame if necessary
    // compute top/bottom (based on new left/right), pin to frame if necessary
    // recompute left/right (based on top/bottom), in case top/bottom were pinned

    // bx is left
    let left: number
    let right: number
    if (bx <= cx) {
      left = bx
      right = bx + vw*xmod
      if (right > hend)
        right = hend
    // bx is right
    } else {
      right = bx
      left = bx - vw*xmod
      if (left < hstart)
        left = hstart
    }

    vw = Math.abs(right - left)

    // by is bottom
    let top: number
    let bottom: number
    if (by <= cy) {
      bottom = by
      top = by + vw/a
      if (top > vend)
        top = vend
    // by is top
    } else {
      top = by
      bottom = by - vw/a
      if (bottom < vstart)
        bottom = vstart
    }

    vh = Math.abs(top - bottom)

    // bx is left
    if (bx <= cx)
      right = bx + a*vh
    // bx is right
    else
      left = bx - a*vh

    return [[left, right], [bottom, top]]
  }

  protected _compute_limits(base_point: Point, curr_point: Point): [Point, Point] {
    const {frame} = this.plot_view

    if (this.model.origin == "center") {
      const [cx, cy] = base_point
      const [dx, dy] = curr_point
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    const dims = (() => {
      const {dimensions} = this.model
      if (dimensions == "auto") {
        const [bx, by] = base_point
        const [cx, cy] = curr_point

        const dx = Math.abs(bx - cx)
        const dy = Math.abs(by - cy)

        const tol = 5

        if (dx < tol && dy > tol)
          return "height"
        else if (dx > tol && dy < tol)
          return "width"
        else
          return "both"
      } else
        return dimensions
    })()

    if (this.model.match_aspect && dims == "both")
      return this._match_aspect(base_point, curr_point, frame)
    else
      return this.model._get_dim_limits(base_point, curr_point, frame, dims)
  }

  override _pan_start(ev: PanEvent): void {
    const {sx, sy} = ev
    if (this.plot_view.frame.bbox.contains(sx, sy))
      this._base_point = [sx, sy]
  }

  override _pan(ev: PanEvent): void {
    if (this._base_point == null)
      return

    const [[left, right], [top, bottom]] = this._compute_limits(this._base_point, [ev.sx, ev.sy])
    this.model.overlay.update({left, right, top, bottom})
  }

  override _pan_end(ev: PanEvent): void {
    if (this._base_point == null)
      return

    const [sx, sy] = this._compute_limits(this._base_point, [ev.sx, ev.sy])
    this._update(sx, sy)
    this._stop()
  }

  protected _stop(): void {
    this.model.overlay.clear()
    this._base_point = null
  }

  override _keydown(ev: KeyEvent): void {
    if (ev.key == "Escape") {
      this._stop()
    }
  }

  override _doubletap(_ev: TapEvent): void {
    const {state} = this.plot_view
    if (state.peek()?.type == "box_zoom")
      state.undo()
  }

  _update([sx0, sx1]: Point, [sy0, sy1]: Point): void {
    // If the viewing window is too small, no-op: it is likely that the user did
    // not intend to make this box zoom and instead was trying to cancel out of the
    // zoom, a la matplotlib's ToolZoom. Like matplotlib, set the threshold at 5 pixels.
    if (Math.abs(sx1 - sx0) <= 5 || Math.abs(sy1 - sy0) <= 5)
      return

    const {x_scales, y_scales} = this.plot_view.frame

    const xrs: RangeState = new Map()
    for (const [, scale] of x_scales) {
      const [start, end] = scale.r_invert(sx0, sx1)
      xrs.set(scale.source_range, {start, end})
    }

    const yrs: RangeState = new Map()
    for (const [, scale] of y_scales) {
      const [start, end] = scale.r_invert(sy0, sy1)
      yrs.set(scale.source_range, {start, end})
    }

    const zoom_info = {xrs, yrs}

    this.plot_view.state.push("box_zoom", {range: zoom_info})
    this.plot_view.update_range(zoom_info)
    this.plot_view.trigger_ranges_update_event()
  }
}

const DEFAULT_BOX_OVERLAY = () => {
  return new BoxAnnotation({
    syncable: false,
    level: "overlay",
    visible: false,
    editable: false,
    left: NaN,
    right: NaN,
    top: NaN,
    bottom: NaN,
    top_units: "canvas",
    left_units: "canvas",
    bottom_units: "canvas",
    right_units: "canvas",
    fill_color: "lightgrey",
    fill_alpha: 0.5,
    line_color: "black",
    line_alpha: 1.0,
    line_width: 2,
    line_dash: [4, 4],
  })
}

export namespace BoxZoomTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    dimensions: p.Property<Dimensions | "auto">
    overlay: p.Property<BoxAnnotation>
    match_aspect: p.Property<boolean>
    origin: p.Property<BoxOrigin>
  }
}

export interface BoxZoomTool extends BoxZoomTool.Attrs {}

export class BoxZoomTool extends GestureTool {
  declare properties: BoxZoomTool.Props
  declare __view_type__: BoxZoomToolView

  constructor(attrs?: Partial<BoxZoomTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxZoomToolView

    this.define<BoxZoomTool.Props>(({Boolean, Ref, Or, Auto}) => ({
      dimensions:   [ Or(Dimensions, Auto), "both" ],
      overlay:      [ Ref(BoxAnnotation), DEFAULT_BOX_OVERLAY ],
      match_aspect: [ Boolean, false ],
      origin:       [ BoxOrigin, "corner" ],
    }))

    this.register_alias("box_zoom", () => new BoxZoomTool({dimensions: "both"}))
    this.register_alias("xbox_zoom", () => new BoxZoomTool({dimensions: "width"}))
    this.register_alias("ybox_zoom", () => new BoxZoomTool({dimensions: "height"}))
    this.register_alias("auto_box_zoom", () => new BoxZoomTool({dimensions: "auto"}))
  }

  override tool_name = "Box Zoom"
  override event_type = ["pan" as "pan", "doubletap" as "doubletap"]
  override get event_role(): EventRole {
    return "pan" as "pan"
  }
  override default_order = 20

  override get computed_icon(): string {
    const icon = super.computed_icon
    if (icon != null)
      return icon
    else {
      switch (this.dimensions) {
        case "both":   return `.${icons.tool_icon_box_zoom}`
        case "width":  return `.${icons.tool_icon_x_box_zoom}`
        case "height": return `.${icons.tool_icon_y_box_zoom}`
        case "auto":   return `.${icons.tool_icon_auto_box_zoom}`
      }
    }
  }

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }

  override get menu(): MenuItem[] | null {
    return [
      {
        icon: icons.tool_icon_box_zoom,
        tooltip: "Box zoom in both dimensions",
        active: () => this.dimensions == "both",
        handler: () => {
          this.dimensions = "both"
          this.active = true
        },
      }, {
        icon: icons.tool_icon_x_box_zoom,
        tooltip: "Box zoom in x-dimension",
        active: () => this.dimensions == "width",
        handler: () => {
          this.dimensions = "width"
          this.active = true
        },
      }, {
        icon: icons.tool_icon_y_box_zoom,
        tooltip: "Box zoom in y-dimension",
        active: () => this.dimensions == "height",
        handler: () => {
          this.dimensions = "height"
          this.active = true
        },
      }, {
        icon: icons.tool_icon_auto_box_zoom,
        tooltip: "Automatic mode (box zoom in x, y or both dimensions, depending on the mouse gesture)",
        active: () => this.dimensions == "auto",
        handler: () => {
          this.dimensions = "auto"
          this.active = true
        },
      },
    ]
  }
}
