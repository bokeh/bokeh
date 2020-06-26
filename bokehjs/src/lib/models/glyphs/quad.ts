import {Box, BoxView, BoxData} from "./box"
import {NumberArray} from "core/types"
import * as p from "core/properties"

export interface QuadData extends BoxData {
  _right: NumberArray
  _bottom: NumberArray
  _left: NumberArray
  _top: NumberArray

  sright: NumberArray
  sbottom: NumberArray
  sleft: NumberArray
  stop: NumberArray
}

export interface QuadView extends QuadData {}

export class QuadView extends BoxView {
  model: Quad
  visuals: Quad.Visuals

  scenterxy(i: number): [number, number] {
    const scx = (this.sleft[i] + this.sright[i])/2
    const scy = (this.stop[i] + this.sbottom[i])/2
    return [scx, scy]
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const l = this._left[i]
    const r = this._right[i]
    const t = this._top[i]
    const b = this._bottom[i]
    return [l, r, t, b]
  }
}

export namespace Quad {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Box.Props & {
    right: p.CoordinateSpec
    bottom: p.CoordinateSpec
    left: p.CoordinateSpec
    top: p.CoordinateSpec
  }

  export type Visuals = Box.Visuals
}

export interface Quad extends Quad.Attrs {}

export class Quad extends Box {
  properties: Quad.Props
  __view_type__: QuadView

  constructor(attrs?: Partial<Quad.Attrs>) {
    super(attrs)
  }

  static init_Quad(): void {
    this.prototype.default_view = QuadView

    this.define<Quad.Props>({
      right:  [ p.XCoordinateSpec, {field: "right"}  ],
      bottom: [ p.YCoordinateSpec, {field: "bottom"} ],
      left:   [ p.XCoordinateSpec, {field: "left"}   ],
      top:    [ p.YCoordinateSpec, {field: "top"}    ],
    })
  }
}
