import {Box, BoxView, BoxData} from "./box"
import {Arrayable} from "core/types"
import {NumberSpec, DistanceSpec} from "core/vectorization"
import * as p from "core/properties"
import {SpatialIndex} from "core/util/spatial"

export interface VBarData extends BoxData {
  _x: Arrayable<number>
  _bottom: Arrayable<number>
  _width: Arrayable<number>
  _top: Arrayable<number>

  sx: Arrayable<number>
  sw: Arrayable<number>
  stop: Arrayable<number>
  sbottom: Arrayable<number>
  sleft: Arrayable<number>
  sright: Arrayable<number>

  max_width: number
}

export interface VBarView extends VBarData {}

export class VBarView extends BoxView {
  model: VBar
  visuals: VBar.Visuals

  scenterx(i: number): number {
    return this.sx[i]
  }

  scentery(i: number): number {
    return (this.stop[i] + this.sbottom[i])/2
  }

  protected _index_data(): SpatialIndex {
    return this._index_box(this._x.length)
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const l = this._x[i] - (this._width[i]/2)
    const r = this._x[i] + (this._width[i]/2)
    const t = Math.max(this._top[i], this._bottom[i])
    const b = Math.min(this._top[i], this._bottom[i])
    return [l, r, t, b]
  }

  protected _map_data(): void {
    this.sx = this.renderer.xscale.v_compute(this._x)
    this.sw = this.sdist(this.renderer.xscale, this._x, this._width, "center")
    this.stop = this.renderer.yscale.v_compute(this._top)
    this.sbottom = this.renderer.yscale.v_compute(this._bottom)

    const n = this.sx.length
    this.sleft = new Float64Array(n)
    this.sright = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      this.sleft[i] = this.sx[i] - this.sw[i]/2
      this.sright[i] = this.sx[i] + this.sw[i]/2
    }

    this._clamp_viewport()
  }
}

export namespace VBar {
  export interface Attrs extends Box.Attrs {
    x: NumberSpec
    bottom: NumberSpec
    width: DistanceSpec
    top: NumberSpec
  }

  export interface Props extends Box.Props {}

  export interface Visuals extends Box.Visuals {}
}

export interface VBar extends VBar.Attrs {}

export class VBar extends Box {

  properties: VBar.Props

  constructor(attrs?: Partial<VBar.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'VBar'
    this.prototype.default_view = VBarView

    this.coords([['x', 'bottom']])
    this.define({
      width:  [ p.DistanceSpec  ],
      top:    [ p.NumberSpec    ],
    })
    this.override({
      bottom: 0,
    })
  }
}
VBar.initClass()
