import {SelectTool, SelectToolView} from "./select_tool"
import {CallbackLike1} from "../../callbacks/callback"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {PolyGeometry} from "core/geometry"
import {GestureEvent, KeyEvent} from "core/ui_events"
import {Keys} from "core/dom"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export class LassoSelectToolView extends SelectToolView {
  model: LassoSelectTool

  protected data: {sx: number[], sy: number[]} | null

  initialize(): void {
    super.initialize()
    this.data = null
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.active.change, () => this._active_change())
  }

  _active_change(): void {
    if (!this.model.active)
      this._clear_overlay()
  }

  _keyup(ev: KeyEvent): void {
    if (ev.keyCode == Keys.Enter)
      this._clear_overlay()
  }

  _pan_start(ev: GestureEvent): void {
    const {sx, sy} = ev
    this.data = {sx: [sx], sy: [sy]}
  }

  _pan(ev: GestureEvent): void {
    const {sx: _sx, sy: _sy} = ev
    const [sx, sy] = this.plot_view.frame.bbox.clip(_sx, _sy)

    this.data!.sx.push(sx)
    this.data!.sy.push(sy)

    const overlay = this.model.overlay
    overlay.update({xs: this.data!.sx, ys: this.data!.sy})

    if (this.model.select_every_mousemove) {
      const append = ev.shiftKey
      this._do_select(this.data!.sx, this.data!.sy, false, append)
    }
  }

  _pan_end(ev: GestureEvent): void {
    this._clear_overlay()
    const append = ev.shiftKey
    this._do_select(this.data!.sx, this.data!.sy, true, append)
    this.plot_view.push_state('lasso_select', {selection: this.plot_view.get_selection()})
  }

  _clear_overlay(): void {
    this.model.overlay.update({xs: [], ys: []})
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

export namespace LassoSelectTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    select_every_mousemove: p.Property<boolean>
    callback: p.Property<CallbackLike1<LassoSelectTool, {
      geometry: PolyGeometry & {x: Arrayable<number>, y: Arrayable<number>}
    }> | null>
    overlay: p.Property<PolyAnnotation>
  }
}

export interface LassoSelectTool extends LassoSelectTool.Attrs {}

export class LassoSelectTool extends SelectTool {
  properties: LassoSelectTool.Props

  /*override*/ overlay: PolyAnnotation

  constructor(attrs?: Partial<LassoSelectTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LassoSelectTool"

    this.prototype.default_view = LassoSelectToolView

    this.define<LassoSelectTool.Props>({
      select_every_mousemove: [ p.Boolean, true                  ],
      callback:               [ p.Any                            ],
      overlay:                [ p.Instance, DEFAULT_POLY_OVERLAY ],
    })
  }

  tool_name = "Lasso Select"
  icon = "bk-tool-icon-lasso-select"
  event_type = "pan" as "pan"
  default_order = 12
}
LassoSelectTool.initClass()
