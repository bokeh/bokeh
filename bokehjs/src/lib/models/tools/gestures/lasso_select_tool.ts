import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {DEFAULT_POLY_OVERLAY} from "./poly_select_tool"
import {SelectionMode} from "core/enums"
import {PolyGeometry} from "core/geometry"
import {PanEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
import {tool_icon_lasso_select} from "styles/icons.css"

export class LassoSelectToolView extends SelectToolView {
  declare model: LassoSelectTool

  override get overlays() {
    return [...super.overlays, this.model.overlay]
  }

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
    if (ev.key == "Enter" || (ev.key == "Escape" && this.model.persistent))
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

    if (this.model.continuous) {
      this._do_select(this.sxs, this.sys, false, this._select_mode(ev))
    }
  }

  override _pan_end(ev: PanEvent): void {
    const {sxs, sys} = this
    if (!this.model.persistent)
      this._clear_overlay()
    this._do_select(sxs, sys, true, this._select_mode(ev))
    this.plot_view.state.push("lasso_select", {selection: this.plot_view.get_selection()})
  }

  _append_overlay(sx: number, sy: number): void {
    this.sxs.push(sx)
    this.sys.push(sy)
    this.model.overlay.update({xs: this.sxs, ys: this.sys})
  }

  _clear_overlay(): void {
    this.sxs = []
    this.sys = []
    this.model.overlay.clear()
  }

  _do_select(sx: number[], sy: number[], final: boolean, mode: SelectionMode): void {
    const geometry: PolyGeometry = {type: "poly", sx, sy}
    this._select(geometry, final, mode)
  }
}

export namespace LassoSelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    continuous: p.Property<boolean>
    persistent: p.Property<boolean>
    overlay: p.Property<PolyAnnotation>
  }
}

export interface LassoSelectTool extends LassoSelectTool.Attrs {}

export class LassoSelectTool extends SelectTool {
  declare properties: LassoSelectTool.Props
  declare __view_type__: LassoSelectToolView

  constructor(attrs?: Partial<LassoSelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = LassoSelectToolView

    this.define<LassoSelectTool.Props>(({Boolean, Ref}) => ({
      continuous: [ Boolean, true ],
      persistent: [ Boolean, false ],
      overlay: [ Ref(PolyAnnotation), DEFAULT_POLY_OVERLAY ],
    }))

    this.register_alias("lasso_select", () => new LassoSelectTool())
  }

  override tool_name = "Lasso Select"
  override tool_icon = tool_icon_lasso_select
  override event_type = "pan" as "pan"
  override default_order = 12
}
