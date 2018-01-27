import {SelectTool, SelectToolView} from "./select_tool"
import {PolyAnnotation} from "../../annotations/poly_annotation"
import {PolyGeometry} from "core/geometry"
import * as p from "core/properties"
import {extend} from "core/util/object"

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
  }
  srcEvent: {
    shiftKey?: boolean
  }
  keyCode: number
}

export class LassoSelectToolView extends SelectToolView {
  model: LassoSelectTool

  protected data: {sx: number[], sy: number[]} | null

  initialize(options: any): void {
    super.initialize(options)
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

  _keyup(e: BkEv): void {
    if (e.keyCode == 13)
      this._clear_overlay()
  }

  _pan_start(e: BkEv): void {
    const {sx, sy} = e.bokeh
    this.data = {sx: [sx], sy: [sy]}
  }

  _pan(e: BkEv): void {
    const {sx: _sx, sy: _sy} = e.bokeh
    const [sx, sy] = this.plot_model.frame.bbox.clip(_sx, _sy)

    this.data!.sx.push(sx)
    this.data!.sy.push(sy)

    const overlay = this.model.overlay
    overlay.update({xs: this.data!.sx, ys: this.data!.sy})

    if (this.model.select_every_mousemove) {
      const append = e.srcEvent.shiftKey || false
      this._do_select(this.data!.sx, this.data!.sy, false, append)
    }
  }

  _pan_end(e: BkEv): void {
    this._clear_overlay()
    const append = e.srcEvent.shiftKey || false
    this._do_select(this.data!.sx, this.data!.sy, true, append)
    this.plot_view.push_state('lasso_select', {selection: this.plot_view.get_selection()})
  }

  _clear_overlay(): void {
    this.model.overlay.update({xs: [], ys: []})
  }

  _do_select(sx: number[], sy: number[], final: boolean, append: boolean): void {
    const geometry: PolyGeometry = {
      type: 'poly',
      sx: sx,
      sy: sy,
    }
    this._select(geometry, final, append)
  }

  _emit_callback(geometry: PolyGeometry): void {
    const r = this.computed_renderers[0]
    const frame = this.plot_model.frame

    const xscale = frame.xscales[r.x_range_name]
    const yscale = frame.yscales[r.y_range_name]

    const x = xscale.v_invert(geometry.sx)
    const y = yscale.v_invert(geometry.sy)
    const g = extend({x, y}, geometry)

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
  export interface Attrs extends SelectTool.Attrs {
    select_every_mousemove: boolean
    callback: any // XXX
    overlay: PolyAnnotation
  }
}

export interface LassoSelectTool extends LassoSelectTool.Attrs {}

export class LassoSelectTool extends SelectTool {

  static initClass() {
    this.prototype.type = "LassoSelectTool"

    this.prototype.default_view = LassoSelectToolView

    this.define({
      select_every_mousemove: [ p.Bool,    true                  ],
      callback:               [ p.Instance                       ],
      overlay:                [ p.Instance, DEFAULT_POLY_OVERLAY ],
    })
  }

  tool_name = "Lasso Select"
  icon = "bk-tool-icon-lasso-select"
  event_type = "pan"
  default_order = 12
}

LassoSelectTool.initClass()
