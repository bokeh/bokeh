import {Box, BoxView, BoxData} from "./box"
import {Arrayable} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import * as p from "core/properties"

export interface QuadData extends BoxData {
  _right: Arrayable<number>
  _bottom: Arrayable<number>
  _left: Arrayable<number>
  _top: Arrayable<number>

  sright: Arrayable<number>
  sbottom: Arrayable<number>
  sleft: Arrayable<number>
  stop: Arrayable<number>
}

export interface QuadView extends QuadData {}

export class QuadView extends BoxView {
  model: Quad
  visuals: Quad.Visuals

  scenterx(i: number): number {
    return (this.sleft[i] + this.sright[i])/2
  }

  scentery(i: number): number {
    return (this.stop[i] + this.sbottom[i])/2
  }

  protected _index_data(): SpatialIndex {
    return this._index_box(this._right.length)
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

  constructor(attrs?: Partial<Quad.Attrs>) {
    super(attrs)
  }

  static init_Quad(): void {
    this.prototype.default_view = QuadView

    this.coords([['right', 'bottom'], ['left', 'top']])
  }
}
