import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {DEFAULT_POLY_OVERLAY} from "./poly_select_tool"
import {SelectionMode} from "core/enums"
import {PolyGeometry} from "core/geometry"
import {PanEvent, KeyEvent} from "core/ui_events"
import {Keys} from "core/dom"
import * as p from "core/properties"
import {tool_icon_lasso_select} from "styles/icons.css"

export class LassoSelectToolView extends SelectToolView {
  override model: LassoSelectTool

  protected sxs: number[] = []
  protected sys: number[] = []

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => this._active_change())
  }

  _active_change(): void {
    if (!this.model.active)
      this._clear_overlay()
  }

  override _keyup(ev: KeyEvent): void {
    if (ev.keyCode == Keys.Enter)
      this._clear_overlay()
  }

  override _pan_start(ev: PanEvent): void {
    this.sxs = []
    this.sys = []
    const {sx, sy} = ev
    this._append_overlay(sx, sy)
  }

  override _pan(ev: PanEvent): void {
    const [sx, sy] = this.plot_view.frame.bbox.clip(ev.sx, ev.sy)
    this._append_overlay(sx, sy)

    if (this.model.select_every_mousemove) {
      this._do_select(this.sxs, this.sys, false, this._select_mode(ev))
    }
  }

  override _pan_end(ev: PanEvent): void {
    const {sxs, sys} = this
    this._clear_overlay()
    this._do_select(sxs, sys, true, this._select_mode(ev))
    this.plot_view.state.push("lasso_select", {selection: this.plot_view.get_selection()})
  }

  _append_overlay(sx: number, sy: number): void {
    const {sxs, sys} = this
    sxs.push(sx)
    sys.push(sy)
    this.model.overlay.update({xs: sxs, ys: sys})
  }

  _clear_overlay(): void {
    this.sxs = []
    this.sys = []
    this.model.overlay.update({xs: this.sxs, ys: this.sys})
  }

  _do_select(sx: number[], sy: number[], final: boolean, mode: SelectionMode): void {
    const geometry: PolyGeometry = {type: "poly", sx, sy}
    this._select(geometry, final, mode)
  }
}

export namespace LassoSelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    select_every_mousemove: p.Property<boolean>
    overlay: p.Property<PolyAnnotation>
  }
}

export interface LassoSelectTool extends LassoSelectTool.Attrs {}

export class LassoSelectTool extends SelectTool {
  override properties: LassoSelectTool.Props
  override __view_type__: LassoSelectToolView

  override overlay: PolyAnnotation

  constructor(attrs?: Partial<LassoSelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LassoSelectToolView

    this.define<LassoSelectTool.Props>(({Boolean, Ref}) => ({
      select_every_mousemove: [ Boolean, true ],
      overlay:                [ Ref(PolyAnnotation), DEFAULT_POLY_OVERLAY ],
    }))

    this.register_alias("lasso_select", () => new LassoSelectTool())
  }

  override tool_name = "Lasso Select"
  override tool_icon = tool_icon_lasso_select
  override event_type = "pan" as "pan"
  override default_order = 12
}
