import {SelectTool, SelectToolView} from "./select_tool"
import {CallbackLike1} from "../../callbacks/callback"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {PolyGeometry} from "core/geometry"
import {TapEvent, KeyEvent} from "core/ui_events"
import {Keys} from "core/dom"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {copy} from "core/util/array"
import {bk_tool_icon_polygon_select} from "styles/icons"

export class PolySelectToolView extends SelectToolView {
  model: PolySelectTool

  protected data: {sx: number[], sy: number[]}

  initialize(): void {
    super.initialize()
    this.data = {sx: [], sy: []}
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => this._active_change())
  }

  _active_change(): void {
    if (!this.model.active)
      this._clear_data()
  }

  _keyup(ev: KeyEvent): void {
    if (ev.keyCode == Keys.Enter)
      this._clear_data()
  }

  _doubletap(ev: TapEvent): void {
    const append = ev.shiftKey
    this._do_select(this.data.sx, this.data.sy, true, append)
    this.plot_view.push_state('poly_select', {selection: this.plot_view.get_selection()})

    this._clear_data()
  }

  _clear_data(): void {
    this.data = {sx: [], sy: []}
    this.model.overlay.update({xs: [], ys: []})
  }

  _tap(ev: TapEvent): void {
    const {sx, sy} = ev

    const frame = this.plot_view.frame
    if (!frame.bbox.contains(sx, sy))
      return

    this.data.sx.push(sx)
    this.data.sy.push(sy)

    this.model.overlay.update({xs: copy(this.data.sx), ys: copy(this.data.sy)})
  }

  _do_select(sx: number[], sy: number[], final: boolean, append: boolean): void {
    const geometry: PolyGeometry = {type: 'poly', sx, sy}
    this._select(geometry, final, append)
  }

  _emit_callback(geometry: PolyGeometry): void {
    const r = this.computed_renderers[0]
    const frame = this.plot_view.frame

    const xscale = frame.xscales[r.x_range_name]
    const yscale = frame.yscales[r.y_range_name]

    const x = xscale.v_invert(geometry.sx)
    const y = yscale.v_invert(geometry.sy)

    const g = {x, y, ...geometry}

    if (this.model.callback != null)
      this.model.callback.execute(this.model, {geometry: g})
  }
}

const DEFAULT_POLY_OVERLAY = () => {
  return new PolyAnnotation({
    level: "overlay",
    xs_units: "screen",
    ys_units: "screen",
    fill_color: {value: "lightgrey"},
    fill_alpha: {value: 0.5},
    line_color: {value: "black"},
    line_alpha: {value: 1.0},
    line_width: {value: 2},
    line_dash: {value: [4, 4]},
  })
}

export namespace PolySelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    callback: p.Property<CallbackLike1<PolySelectTool, {
      geometry: PolyGeometry & {x: Arrayable<number>, y: Arrayable<number>}
    }> | null>
    overlay: p.Property<PolyAnnotation>
  }
}

export interface PolySelectTool extends PolySelectTool.Attrs {}

export class PolySelectTool extends SelectTool {
  properties: PolySelectTool.Props

  /*override*/ overlay: PolyAnnotation

  constructor(attrs?: Partial<PolySelectTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.default_view = PolySelectToolView

    this.define<PolySelectTool.Props>({
      callback:   [ p.Any                            ],
      overlay:    [ p.Instance, DEFAULT_POLY_OVERLAY ],
    })
  }

  tool_name = "Poly Select"
  icon = bk_tool_icon_polygon_select
  event_type = "tap" as "tap"
  default_order = 11
}
PolySelectTool.initClass()
