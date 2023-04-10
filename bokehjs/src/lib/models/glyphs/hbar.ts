import {LRTB, LRTBView, LRTBData} from "./lrtb"
import {FloatArray, ScreenArray} from "core/types"
import * as p from "core/properties"

export type HBarData = LRTBData & {
  _left: FloatArray
  _y: FloatArray
  readonly height: p.Uniform<number>
  _right: FloatArray

  sy: ScreenArray
  sh: ScreenArray
  sleft: ScreenArray
  sright: ScreenArray
  stop: ScreenArray
  sbottom: ScreenArray
}

export interface HBarView extends HBarData {}

export class HBarView extends LRTBView {
  declare model: HBar
  declare visuals: HBar.Visuals

  scenterxy(i: number): [number, number] {
    const scx = (this.sleft[i] + this.sright[i])/2
    const scy = this.sy[i]
    return [scx, scy]
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const left_i = this._left[i]
    const right_i = this._right[i]
    const y_i = this._y[i]
    const half_height_i = this.height.get(i)/2

    const l = Math.min(left_i, right_i)
    const r = Math.max(left_i, right_i)
    const t = y_i + half_height_i
    const b = y_i - half_height_i

    return [l, r, t, b]
  }

  protected override _map_data(): void {
    this.sy = this.renderer.yscale.v_compute(this._y)
    this.sh = this.sdist(this.renderer.yscale, this._y, this.height, "center")
    this.sleft = this.renderer.xscale.v_compute(this._left)
    this.sright = this.renderer.xscale.v_compute(this._right)

    const n = this.sy.length
    this.stop = new ScreenArray(n)
    this.sbottom = new ScreenArray(n)
    for (let i = 0; i < n; i++) {
      this.stop[i] = this.sy[i] - this.sh[i]/2
      this.sbottom[i] = this.sy[i] + this.sh[i]/2
    }

    this._clamp_viewport()
  }
}

export namespace HBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LRTB.Props & {
    left: p.CoordinateSpec
    y: p.CoordinateSpec
    height: p.NumberSpec
    right: p.CoordinateSpec
  }

  export type Visuals = LRTB.Visuals
}

export interface HBar extends HBar.Attrs {}

export class HBar extends LRTB {
  declare properties: HBar.Props
  declare __view_type__: HBarView

  constructor(attrs?: Partial<HBar.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HBarView

    this.define<HBar.Props>(({}) => ({
      left:   [ p.XCoordinateSpec, {value: 0} ],
      y:      [ p.YCoordinateSpec, {field: "y"} ],
      height: [ p.NumberSpec,      {value: 1} ],
      right:  [ p.XCoordinateSpec, {field: "right"} ],
    }))
  }
}
