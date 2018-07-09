import {Box, BoxView, BoxData} from "./box"
import {Arrayable} from "core/types"
import {DistanceSpec, NumberSpec} from "core/vectorization"
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
  export interface Attrs extends Box.Attrs {
    left: NumberSpec
    y: NumberSpec
    height: DistanceSpec
    right: NumberSpec
  }

  export interface Props extends Box.Props {}

  export interface Visuals extends Box.Visuals {}
}

export interface HBar extends HBar.Attrs {}

export class HBar extends Box {

  properties: HBar.Props

  constructor(attrs?: Partial<HBar.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'HBar'
    this.prototype.default_view = HBarView

    this.coords([['left', 'y']])
    this.define({
      height: [ p.DistanceSpec  ],
      right:  [ p.NumberSpec    ],
    })
    this.override({ left: 0 })
  }
}
HBar.initClass()
