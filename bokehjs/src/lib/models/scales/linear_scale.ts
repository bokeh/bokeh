import {ContinuousScale} from "./continuous_scale"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace LinearScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousScale.Props
}

export interface LinearScale extends LinearScale.Attrs {}

export class LinearScale extends ContinuousScale {
  properties: LinearScale.Props

  constructor(attrs?: Partial<LinearScale.Attrs>) {
    super(attrs)
  }

  compute(x: number): number {
    return this._linear_compute(x)
  }

  v_compute(xs: Arrayable<number>): Arrayable<number> {
    return this._linear_v_compute(xs)
  }

  invert(xprime: number): number {
    return this._linear_invert(xprime)
  }

  v_invert(xprimes: Arrayable<number>): Arrayable<number> {
    return this._linear_v_invert(xprimes)
  }
}
