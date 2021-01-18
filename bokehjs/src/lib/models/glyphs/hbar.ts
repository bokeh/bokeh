import {Box, BoxView, BoxData} from "./box"
import {FloatArray, ScreenArray} from "core/types"
import * as p from "core/properties"

export type HBarData = BoxData & {
  _left: FloatArray
  _y: FloatArray
  _height: FloatArray
  _right: FloatArray

  sy: ScreenArray
  sh: ScreenArray
  sleft: ScreenArray
  sright: ScreenArray
  stop: ScreenArray
  sbottom: ScreenArray

  max_height: number
}

export interface HBarView extends HBarData {}

export class HBarView extends BoxView {
  model: HBar
  visuals: HBar.Visuals

  scenterxy(i: number): [number, number] {
    const scx = (this.sleft[i] + this.sright[i])/2
    const scy = this.sy[i]
    return [scx, scy]
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const l = Math.min(this._left[i], this._right[i])
    const r = Math.max(this._left[i], this._right[i])
    const t = this._y[i] + 0.5*this._height[i]
    const b = this._y[i] - 0.5*this._height[i]
    return [l, r, t, b]
  }

  protected _map_data(): void {
    this.sy = this.renderer.yscale.v_compute(this._y)
    this.sh = this.sdist(this.renderer.yscale, this._y, this._height, "center")
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

  export type Props = Box.Props & {
    left: p.CoordinateSpec
    y: p.CoordinateSpec
    height: p.NumberSpec
    right: p.CoordinateSpec
  }

  export type Visuals = Box.Visuals
}

export interface HBar extends HBar.Attrs {}

export class HBar extends Box {
  properties: HBar.Props
  __view_type__: HBarView

  constructor(attrs?: Partial<HBar.Attrs>) {
    super(attrs)
  }

  static init_HBar(): void {
    this.prototype.default_view = HBarView

    this.define<HBar.Props>(({}) => ({
      left:   [ p.XCoordinateSpec, {value: 0} ],
      y:      [ p.YCoordinateSpec, {field: "y"} ],
      height: [ p.NumberSpec,      {value: 1} ],
      right:  [ p.XCoordinateSpec, {field: "right"} ],
    }))
  }
}
