import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {SelectionMode} from "core/enums"
import {PolyGeometry} from "core/geometry"
import {TapEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
import {tool_icon_polygon_select} from "styles/icons.css"

export class PolySelectToolView extends SelectToolView {
  override model: PolySelectTool

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
      this._clear_data()
  }

  override _keyup(ev: KeyEvent): void {
    if (ev.key == "Enter")
      this._clear_data()
  }

  override _doubletap(ev: TapEvent): void {
    this._do_select(this.sxs, this.sys, true, this._select_mode(ev))
    this.plot_view.state.push("poly_select", {selection: this.plot_view.get_selection()})
    this._clear_data()
  }

  _clear_data(): void {
    this.sxs = []
    this.sys = []
    this.model.overlay.clear()
  }

  override _tap(ev: TapEvent): void {
    const {sx, sy} = ev

    const frame = this.plot_view.frame
    if (!frame.bbox.contains(sx, sy))
      return

    this.sxs.push(sx)
    this.sys.push(sy)

    this.model.overlay.update({xs: this.sxs, ys: this.sys})

    if (this.model.select_every_mousemove) {
      this._do_select(this.sxs, this.sys, true, this._select_mode(ev))
    }
  }

  _do_select(sx: number[], sy: number[], final: boolean, mode: SelectionMode): void {
    const geometry: PolyGeometry = {type: "poly", sx, sy}
    this._select(geometry, final, mode)
  }
}

export const DEFAULT_POLY_OVERLAY = () => {
  return new PolyAnnotation({
    syncable: false,
    level: "overlay",
    visible: false,
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
    select_every_mousemove: p.Property<boolean>
    overlay: p.Property<PolyAnnotation>
  }
}

export interface PolySelectTool extends PolySelectTool.Attrs {}

export class PolySelectTool extends SelectTool {
  override properties: PolySelectTool.Props
  override __view_type__: PolySelectToolView

  constructor(attrs?: Partial<PolySelectTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = PolySelectToolView

    this.define<PolySelectTool.Props>(({Boolean, Ref}) => ({
      select_every_mousemove: [ Boolean, false ],
      overlay: [ Ref(PolyAnnotation), DEFAULT_POLY_OVERLAY ],
    }))

    this.register_alias("poly_select", () => new PolySelectTool())
  }

  override tool_name = "Poly Select"
  override tool_icon = tool_icon_polygon_select
  override event_type = "tap" as "tap"
  override default_order = 11
}
