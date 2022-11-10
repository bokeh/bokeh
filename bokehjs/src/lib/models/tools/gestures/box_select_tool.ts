import {SelectTool, SelectToolView} from "./select_tool"
import {BoxAnnotation} from "../../annotations/box_annotation"
import {Scale} from "../../scales/scale"
import * as p from "core/properties"
import {Dimensions, BoxOrigin, SelectionMode, CoordinateUnits} from "core/enums"
import {PanEvent, KeyEvent} from "core/ui_events"
import {RectGeometry} from "core/geometry"
import {CoordinateMapper, LRTB} from "core/util/bbox"
import * as icons from "styles/icons.css"

export class BoxSelectToolView extends SelectToolView {
  declare model: BoxSelectTool

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {pan} = this.model.overlay
    this.connect(pan, ([phase, ev]) => {
      if ((phase == "pan" && this.model.select_every_mousemove) || phase == "pan:end") {
        const {left, top, right, bottom} = this.model.overlay
        if (left != null && top != null && right != null && bottom != null) {
          const screen = this._compute_lrtb({left, right, top, bottom})
          this._do_select([screen.left, screen.right], [screen.top, screen.bottom], false, this._select_mode(ev))
        }
      }
    })

    const {active} = this.model.properties
    this.on_change(active, () => {
      if (!this.model.active && !this.model.persistent)
        this._clear_overlay()
    })
  }

  protected _base_point: [number, number] | null

  protected _compute_limits(curpoint: [number, number]): [[number, number], [number, number]] {
    const frame = this.plot_view.frame
    const dims = this.model.dimensions

    let base_point = this._base_point!
    if (this.model.origin == "center") {
      const [cx, cy] = base_point
      const [dx, dy] = curpoint
      base_point = [cx - (dx - cx), cy - (dy - cy)]
    }

    return this.model._get_dim_limits(base_point, curpoint, frame, dims)
  }

  _compute_lrtb({left, right, top, bottom}: LRTB): LRTB {
    function compute(dim: number, dim_units: CoordinateUnits,
        scale: Scale, view: CoordinateMapper, canvas: CoordinateMapper) {
      switch (dim_units) {
        case "canvas": return canvas.compute(dim)
        case "screen": return view.compute(dim)
        case "data":   return scale.compute(dim)
      }
    }

    const {overlay} = this.model
    const {frame, canvas} = this.plot_view
    const {x_scale, y_scale} = frame
    const {x_view, y_view} = frame.bbox
    const {x_screen, y_screen} = canvas.bbox

    return {
      left: compute(left, overlay.left_units, x_scale, x_view, x_screen),
      right: compute(right, overlay.right_units, x_scale, x_view, x_screen),
      top: compute(top, overlay.top_units, y_scale, y_view, y_screen),
      bottom: compute(bottom, overlay.bottom_units, y_scale, y_view, y_screen),
    }
  }

  _invert_lrtb({left, right, top, bottom}: LRTB): LRTB {
    function invert(dim: number, dim_units: CoordinateUnits,
        scale: Scale, view: CoordinateMapper, canvas: CoordinateMapper) {
      switch (dim_units) {
        case "canvas": return canvas.invert(dim)
        case "screen": return view.invert(dim)
        case "data":   return scale.invert(dim)
      }
    }

    const {overlay} = this.model
    const {frame, canvas} = this.plot_view
    const {x_scale, y_scale} = frame
    const {x_view, y_view} = frame.bbox
    const {x_screen, y_screen} = canvas.bbox

    return {
      left: invert(left, overlay.left_units, x_scale, x_view, x_screen),
      right: invert(right, overlay.right_units, x_scale, x_view, x_screen),
      top: invert(top, overlay.top_units, y_scale, y_view, y_screen),
      bottom: invert(bottom, overlay.bottom_units, y_scale, y_view, y_screen),
    }
  }

  override _pan_start(ev: PanEvent): void {
    const {sx, sy} = ev
    if (this.plot_view.frame.bbox.contains(sx, sy))
      this._base_point = [sx, sy]
  }

  override _pan(ev: PanEvent): void {
    if (this._base_point == null)
      return

    const {sx, sy} = ev
    const [sxlim, sylim] = this._compute_limits([sx, sy])

    const [[left, right], [top, bottom]] = [sxlim, sylim]
    this.model.overlay.update(this._invert_lrtb({left, right, top, bottom}))

    if (this.model.continuous) {
      this._do_select(sxlim, sylim, false, this._select_mode(ev))
    }
  }

  override _pan_end(ev: PanEvent): void {
    if (this._base_point == null)
      return

    const {sx, sy} = ev
    const [sxlim, sylim] = this._compute_limits([sx, sy])
    this._do_select(sxlim, sylim, true, this._select_mode(ev))

    if (!this.model.persistent) {
      this._clear_overlay()
    }

    this._base_point = null
    this.plot_view.state.push("box_select", {selection: this.plot_view.get_selection()})
  }

  protected get _is_selecting(): boolean {
    return this._base_point != null
  }

  protected _stop(): void {
    this._clear_overlay()
    this._base_point = null
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active)
      return

    if (ev.key == "Escape") {
      if (this._is_selecting) {
        this._stop()
        return
      }

      if (this.model.overlay.visible) {
        this._clear_overlay()
        return
      }
    }

    super._keyup(ev)
  }

  override _clear_selection(): void {
    this._clear_overlay()
    super._clear_selection()
  }

  _clear_overlay(): void {
    this.model.overlay.clear()
  }

  _do_select([sx0, sx1]: [number, number], [sy0, sy1]: [number, number], final: boolean, mode: SelectionMode = "replace"): void {
    const geometry: RectGeometry = {type: "rect", sx0, sx1, sy0, sy1}
    this._select(geometry, final, mode)
  }
}

const DEFAULT_BOX_OVERLAY = () => {
  return new BoxAnnotation({
    syncable: false,
    level: "overlay",
    visible: false,
    editable: true,
    top_units: "data",
    left_units: "data",
    bottom_units: "data",
    right_units: "data",
    fill_color: "lightgrey",
    fill_alpha: 0.5,
    line_color: "black",
    line_alpha: 1.0,
    line_width: 2,
    line_dash: [4, 4],
  })
}

export namespace BoxSelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    dimensions: p.Property<Dimensions>
    continuous: p.Property<boolean>
    overlay: p.Property<BoxAnnotation>
    origin: p.Property<BoxOrigin>
    persistent: p.Property<boolean>
  }
}

export interface BoxSelectTool extends BoxSelectTool.Attrs {}

export class BoxSelectTool extends SelectTool {
  declare properties: BoxSelectTool.Props
  declare __view_type__: BoxSelectToolView

  constructor(attrs?: Partial<BoxSelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BoxSelectToolView

    this.define<BoxSelectTool.Props>(({Boolean, Ref}) => ({
      dimensions: [ Dimensions, "both" ],
      continuous: [ Boolean, false ],
      overlay:    [ Ref(BoxAnnotation), DEFAULT_BOX_OVERLAY ],
      origin:     [ BoxOrigin, "corner" ],
      persistent: [ Boolean, false ],
    }))

    this.register_alias("box_select", () => new BoxSelectTool())
    this.register_alias("xbox_select", () => new BoxSelectTool({dimensions: "width"}))
    this.register_alias("ybox_select", () => new BoxSelectTool({dimensions: "height"}))
  }

  override tool_name = "Box Select"
  override event_type = "pan" as "pan"
  override default_order = 30

  override get computed_icon(): string {
    const icon = super.computed_icon
    if (icon != null)
      return icon
    else {
      switch (this.dimensions) {
        case "both":   return `.${icons.tool_icon_box_select}`
        case "width":  return `.${icons.tool_icon_x_box_select}`
        case "height": return `.${icons.tool_icon_y_box_select}`
      }
    }
  }

  override get tooltip(): string {
    return this._get_dim_tooltip(this.dimensions)
  }
}
