import {LRTB, LRTBView, LRTBData} from "./lrtb"
import {FloatArray, ScreenArray} from "core/types"
import * as p from "core/properties"

export type VBarData = LRTBData & {
  _x: FloatArray
  _bottom: FloatArray
  readonly width: p.Uniform<number>
  _top: FloatArray

  sx: ScreenArray
  sw: ScreenArray
  stop: ScreenArray
  sbottom: ScreenArray
  sleft: ScreenArray
  sright: ScreenArray
}

export interface VBarView extends VBarData {}

export class VBarView extends LRTBView {
  declare model: VBar
  declare visuals: VBar.Visuals

  scenterxy(i: number): [number, number] {
    const scx = this.sx[i]
    const scy = (this.stop[i] + this.sbottom[i])/2
    return [scx, scy]
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const half_width_i = this.width.get(i)/2
    const x_i = this._x[i]
    const top_i = this._top[i]
    const bottom_i = this._bottom[i]

    const l = x_i - half_width_i
    const r = x_i + half_width_i
    const t = Math.max(top_i, bottom_i)
    const b = Math.min(top_i, bottom_i)

    return [l, r, t, b]
  }

  protected override _map_data(): void {
    this.sx = this.renderer.xscale.v_compute(this._x)
    this.sw = this.sdist(this.renderer.xscale, this._x, this.width, "center")
    this.stop = this.renderer.yscale.v_compute(this._top)
    this.sbottom = this.renderer.yscale.v_compute(this._bottom)

    const n = this.sx.length
    this.sleft = new ScreenArray(n)
    this.sright = new ScreenArray(n)
    for (let i = 0; i < n; i++) {
      this.sleft[i] = this.sx[i] - this.sw[i]/2
      this.sright[i] = this.sx[i] + this.sw[i]/2
    }

    this._clamp_viewport()
  }
}

export namespace VBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LRTB.Props & {
    x: p.CoordinateSpec
    bottom: p.CoordinateSpec
    width: p.NumberSpec
    top: p.CoordinateSpec
  }

  export type Visuals = LRTB.Visuals
}

export interface VBar extends VBar.Attrs {}

export class VBar extends LRTB {
  declare properties: VBar.Props
  declare __view_type__: VBarView

  constructor(attrs?: Partial<VBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VBarView

    this.define<VBar.Props>(({}) => ({
      x:      [ p.XCoordinateSpec, {field: "x"} ],
      bottom: [ p.YCoordinateSpec, {value: 0} ],
      width:  [ p.NumberSpec,      {value: 1} ],
      top:    [ p.YCoordinateSpec, {field: "top"} ],
    }))
  }
}
