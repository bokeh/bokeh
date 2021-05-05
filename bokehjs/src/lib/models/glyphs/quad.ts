import {Box, BoxView, BoxData} from "./box"
import {FloatArray, ScreenArray} from "core/types"
import * as p from "core/properties"

export type QuadData = BoxData & {
  _right: FloatArray
  _bottom: FloatArray
  _left: FloatArray
  _top: FloatArray

  sright: ScreenArray
  sbottom: ScreenArray
  sleft: ScreenArray
  stop: ScreenArray
}

export interface QuadView extends QuadData {}

export class QuadView extends BoxView {
  override model: Quad
  override visuals: Quad.Visuals

  scenterxy(i: number): [number, number] {
    const scx = this.sleft[i]/2 + this.sright[i]/2
    const scy = this.stop[i]/2 + this.sbottom[i]/2
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
  override properties: Quad.Props
  override __view_type__: QuadView

  constructor(attrs?: Partial<Quad.Attrs>) {
    super(attrs)
  }

  static init_Quad(): void {
    this.prototype.default_view = QuadView

    this.define<Quad.Props>(({}) => ({
      right:  [ p.XCoordinateSpec, {field: "right"} ],
      bottom: [ p.YCoordinateSpec, {field: "bottom"} ],
      left:   [ p.XCoordinateSpec, {field: "left"} ],
      top:    [ p.YCoordinateSpec, {field: "top"} ],
    }))
  }
}
