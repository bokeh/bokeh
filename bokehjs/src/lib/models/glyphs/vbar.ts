import {Box, BoxView, BoxData} from "./box"
import {NumberArray} from "core/types"
import * as p from "core/properties"

export interface VBarData extends BoxData {
  _x: NumberArray
  _bottom: NumberArray
  _width: NumberArray
  _top: NumberArray

  sx: NumberArray
  sw: NumberArray
  stop: NumberArray
  sbottom: NumberArray
  sleft: NumberArray
  sright: NumberArray

  max_width: number
}

export interface VBarView extends VBarData {}

export class VBarView extends BoxView {
  model: VBar
  visuals: VBar.Visuals

  scenterxy(i: number): [number, number] {
    const scx = this.sx[i]
    const scy = (this.stop[i] + this.sbottom[i])/2
    return [scx, scy]
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
    this.sleft = new NumberArray(n)
    this.sright = new NumberArray(n)
    for (let i = 0; i < n; i++) {
      this.sleft[i] = this.sx[i] - this.sw[i]/2
      this.sright[i] = this.sx[i] + this.sw[i]/2
    }

    this._clamp_viewport()
  }
}

export namespace VBar {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Box.Props & {
    x: p.CoordinateSpec
    bottom: p.CoordinateSpec
    width: p.NumberSpec
    top: p.CoordinateSpec
  }

  export type Visuals = Box.Visuals
}

export interface VBar extends VBar.Attrs {}

export class VBar extends Box {
  properties: VBar.Props
  __view_type__: VBarView

  constructor(attrs?: Partial<VBar.Attrs>) {
    super(attrs)
  }

  static init_VBar(): void {
    this.prototype.default_view = VBarView

    this.define<VBar.Props>({
      x:      [ p.XCoordinateSpec, {field: "x"}      ],
      bottom: [ p.YCoordinateSpec, 0                 ],
      width:  [ p.NumberSpec,      {field: "width"}  ],
      top:    [ p.YCoordinateSpec, {field: "top"}    ],
    })
  }
}
