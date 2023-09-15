import {RegionSelectTool, RegionSelectToolView} from "./region_select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import type {Scale} from "../../scales/scale"
import type {SelectionMode, CoordinateUnits} from "core/enums"
import type {HitTestPoly} from "core/geometry"
import type {Arrayable} from "core/types"
import type {TapEvent, KeyEvent, KeyModifiers} from "core/ui_events"
import type {CoordinateMapper} from "core/util/bbox"
import type * as p from "core/properties"
import {tool_icon_polygon_select} from "styles/icons.css"

type NumArray = Arrayable<number>

export class PolySelectToolView extends RegionSelectToolView {
  declare model: PolySelectTool

  protected _is_selecting: boolean = false

  protected _mappers(): {x: CoordinateMapper, y: CoordinateMapper} {
    const mapper = (units: CoordinateUnits, scale: Scale,
        view: CoordinateMapper, canvas: CoordinateMapper): CoordinateMapper => {
      switch (units) {
        case "canvas": return canvas
        case "screen": return view
        case "data":   return scale
      }
    }

    const {overlay} = this.model
    const {frame, canvas} = this.plot_view
    const {x_scale, y_scale} = frame
    const {x_view, y_view} = frame.bbox
    const {x_screen, y_screen} = canvas.bbox

    return {
      x: mapper(overlay.xs_units, x_scale, x_view, x_screen),
      y: mapper(overlay.ys_units, y_scale, y_view, y_screen),
    }
  }

  protected _v_compute(xs: NumArray, ys: NumArray): [NumArray, NumArray] {
    const {x, y} = this._mappers()
    return [x.v_compute(xs), y.v_compute(ys)]
  }

  protected _v_invert(sxs: NumArray, sys: NumArray): [NumArray, NumArray] {
    const {x, y} = this._mappers()
    return [x.v_invert(sxs), y.v_invert(sys)]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {pan} = this.model.overlay
    this.connect(pan, ([phase, ev]) => {
      if ((phase == "pan" && this._is_continuous(ev)) || (phase == "pan:end" && !this._is_selecting)) {
        const {xs, ys} = this.model.overlay
        const [sxs, sys] = this._v_compute(xs, ys)
        this._do_select(sxs, sys, false, this._select_mode(ev))
      }
    })

    const {active} = this.model.properties
    this.on_change(active, () => {
      if (!this.model.active && !this.model.persistent)
        this._clear_overlay()
    })
  }

  override _tap(ev: TapEvent): void {
    const {sx, sy} = ev
    const {frame} = this.plot_view
    if (!frame.bbox.contains(sx, sy))
      return

    this._clear_other_overlays()

    const [sxs, sys] = (() => {
      if (this._is_selecting) {
        const {xs, ys} = this.model.overlay
        const [sxs, sys] = this._v_compute(xs, ys)
        return [[...sxs], [...sys]]
      } else {
        this._is_selecting = true
        return [[], []]
      }
    })()

    sxs.push(sx)
    sys.push(sy)

    const [xs, ys] = this._v_invert(sxs, sys)
    this.model.overlay.update({xs, ys})

    if (this._is_continuous(ev.modifiers)) {
      this._do_select(sxs, sys, true, this._select_mode(ev.modifiers))
    }
  }

  protected _finish_selection(ev: KeyModifiers): void {
    this._is_selecting = false

    const {xs, ys} = this.model.overlay
    const [sxs, sys] = this._v_compute(xs, ys)
    this._do_select(sxs, sys, true, this._select_mode(ev))
    this.plot_view.state.push("poly_select", {selection: this.plot_view.get_selection()})

    if (!this.model.persistent)
      this._clear_overlay()
  }

  override _doubletap(ev: TapEvent): void {
    this._finish_selection(ev.modifiers)
  }

  override _keyup(ev: KeyEvent): void {
    if (!this.model.active)
      return

    if (ev.key == "Enter") {
      this._finish_selection(ev.modifiers)
      return
    }

    if (ev.key == "Escape") {
      if (this.model.overlay.visible) {
        this._clear_overlay()
        return
      }
    }

    super._keyup(ev)
  }

  override _clear_selection(): void {
    if (this.model.overlay.visible)
      this._clear_overlay()
    else {
      this._is_selecting = false
      super._clear_selection()
    }
  }

  protected override _clear_overlay(): void {
    this._is_selecting = false
    super._clear_overlay()
  }

  _do_select(sx: NumArray, sy: NumArray, final: boolean, mode: SelectionMode): void {
    const {greedy} = this.model
    const geometry: HitTestPoly = {type: "poly", sx, sy, greedy}
    this._select(geometry, final, mode)
  }
}

export const DEFAULT_POLY_OVERLAY = () => {
  return new PolyAnnotation({
    syncable: false,
    level: "overlay",
    visible: false,
    editable: true,
    xs_units: "data",
    ys_units: "data",
    fill_color: "lightgrey",
    fill_alpha: 0.5,
    line_color: "black",
    line_alpha: 1.0,
    line_width: 2,
    line_dash: [4, 4],
  })
}

export namespace PolySelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RegionSelectTool.Props & {
    overlay: p.Property<PolyAnnotation>
  }
}

export interface PolySelectTool extends PolySelectTool.Attrs {}

export class PolySelectTool extends RegionSelectTool {
  declare properties: PolySelectTool.Props
  declare __view_type__: PolySelectToolView
  declare overlay: PolyAnnotation

  constructor(attrs?: Partial<PolySelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PolySelectToolView

    this.define<PolySelectTool.Props>(({Ref}) => ({
      overlay: [ Ref(PolyAnnotation), DEFAULT_POLY_OVERLAY ],
    }))

    this.register_alias("poly_select", () => new PolySelectTool())
  }

  override tool_name = "Poly Select"
  override tool_icon = tool_icon_polygon_select
  override event_type = "tap" as "tap"
  override default_order = 11
}
