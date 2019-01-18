import {Box, BoxView, BoxData} from "./box"
import {Scale} from "../scales/scale"
import {Arrayable} from "core/types"
import {InfinityPosition} from "core/enums"
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

    protected _handle_infinite_values(vals: Arrayable<number>, scale: Scale): Arrayable<number> {
    const result = new Float64Array(vals.length)
    for (let i = 0; i < vals.length; i++) {
      const val = vals[i]
      let value: number
      if (isFinite(val))
        value = val
      else
        switch (this.model.inf) {
          case "screen_min": {
            value = scale.screen_min()
            break
          }
          case "screen_max": {
            value = scale.screen_max()
            break
          }
          case null: {
            value = NaN
            break
          }
          default: {
            // TODO - Raise an error here?
            value = val
            break
          }
        }
      result[i] = value
    }
    return result
  }

  protected _map_data(): void {
    let sx: Arrayable<number>
    let stop: Arrayable<number>
    let sbottom: Arrayable<number>

    sx = this.renderer.xscale.v_compute(this._x)
    stop = this.renderer.yscale.v_compute(this._top)
    sbottom = this.renderer.yscale.v_compute(this._bottom)

    this.sx = this._handle_infinite_values(sx, this.renderer.xscale)
    this.sw = this.sdist(this.renderer.xscale, this._x, this._width, "center")
    this.stop = this._handle_infinite_values(stop, this.renderer.yscale)
    this.sbottom = this._handle_infinite_values(sbottom, this.renderer.yscale)

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
    inf: InfinityPosition
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
      inf:    [ p.InfinityPosition, "screen_min"],
    })
    this.override({
      bottom: 0,
    })
  }
}
VBar.initClass()
