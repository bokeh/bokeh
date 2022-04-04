import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {SelectionMode} from "core/enums"
import {PolyGeometry} from "core/geometry"
import {TapEvent, KeyEvent} from "core/ui_events"
import {Keys} from "core/dom"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {tool_icon_polygon_select} from "styles/icons.css"

export class PolySelectToolView extends SelectToolView {
  override model: PolySelectTool

  override connect_signals(): void {
    super.connect_signals()

    this.connect(this.model.properties.active.change, () => {
      if (!this.model.active)
        this._clear_data()
    })

    const {pan} = this.model.overlay
    this.connect(pan, (phase) => {
      if (/*(phase == "pan" && this.model.select_every_mousemove) ||*/ phase == "pan:end") {
        const {xs, ys} = this.model.overlay
        this._do_select(xs, ys, false, this.model.mode)
      }
    })
  }

  override _keyup(ev: KeyEvent): void {
    if (ev.keyCode == Keys.Enter)
      this._clear_data()
  }

  override _doubletap(ev: TapEvent): void {
    const {xs, ys} = this.model.overlay
    this._do_select(xs, ys, true, this._select_mode(ev))
    this.plot_view.state.push("poly_select", {selection: this.plot_view.get_selection()})
    this._clear_data()
  }

  _clear_data(): void {
    this.model.overlay.clear()
  }

  override _tap(ev: TapEvent): void {
    const {sx, sy} = ev

    const frame = this.plot_view.frame
    if (!frame.bbox.contains(sx, sy))
      return

    const {overlay} = this.model
    const {xs, ys} = overlay

    this.model.overlay.update({xs: [...xs, sx], ys: [...ys, sy]})
  }

  _do_select(xs: Arrayable<number>, ys: Arrayable<number>, final: boolean, mode: SelectionMode): void {
    const geometry: PolyGeometry = {type: "poly", sx: xs, sy: ys}
    this._select(geometry, final, mode)
  }
}

export const DEFAULT_POLY_OVERLAY = () => {
  return new PolyAnnotation({
    level: "overlay",
    xs_units: "canvas",
    ys_units: "canvas",
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

  export type Props = SelectTool.Props & {
    overlay: p.Property<PolyAnnotation>
  }
}

export interface PolySelectTool extends PolySelectTool.Attrs {}

export class PolySelectTool extends SelectTool {
  override properties: PolySelectTool.Props
  override __view_type__: PolySelectToolView

  override overlay: PolyAnnotation

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

  override get computed_overlays() {
    return [...super.computed_overlays, this.overlay]
  }
}
