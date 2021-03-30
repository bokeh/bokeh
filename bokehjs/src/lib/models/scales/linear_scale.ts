import {ContinuousScale} from "./continuous_scale"
import {Arrayable, ScreenArray, FloatArray} from "core/types"
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

  get s_compute(): (x: number) => number {
    const [factor, offset] = this._linear_compute_state()
    return (x) => factor*x + offset
  }

  get s_invert(): (sx: number) => number {
    const [factor, offset] = this._linear_compute_state()
    return (sx) => (sx - offset) / factor
  }

  compute(x: number): number {
    return this._linear_compute(x)
  }

  v_compute(xs: Arrayable<number>): ScreenArray {
    return this._linear_v_compute(xs)
  }

  invert(xprime: number): number {
    return this._linear_invert(xprime)
  }

  v_invert(xprimes: Arrayable<number>): FloatArray {
    return this._linear_v_invert(xprimes)
  }
}
