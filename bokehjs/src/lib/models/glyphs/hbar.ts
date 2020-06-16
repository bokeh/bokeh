import {Box, BoxView, BoxData} from "./box"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {SpatialIndex} from "core/util/spatial"

export interface HBarData extends BoxData {
  _left: Arrayable<number>
  _y: Arrayable<number>
  _height: Arrayable<number>
  _right: Arrayable<number>

  sy: Arrayable<number>
  sh: Arrayable<number>
  sleft: Arrayable<number>
  sright: Arrayable<number>
  stop: Arrayable<number>
  sbottom: Arrayable<number>

  max_height: number
}

export interface HBarView extends HBarData {}

export class HBarView extends BoxView {
  model: HBar
  visuals: HBar.Visuals

  scenterx(i: number): number {
    return (this.sleft[i] + this.sright[i])/2
  }

  scentery(i: number): number {
    return this.sy[i]
  }

  protected _index_data(): SpatialIndex {
    return this._index_box(this._y.length)
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
    this.stop = new Float64Array(n)
    this.sbottom = new Float64Array(n)
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

    this.coords([['left', 'y']])
    this.define<HBar.Props>({
      height: [ p.NumberSpec     ],
      right:  [ p.CoordinateSpec ],
    })
    this.override({ left: 0 })
  }
}
