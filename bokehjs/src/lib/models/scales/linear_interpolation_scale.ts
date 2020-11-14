import {Scale} from "./scale"
import {Arrayable, NumberArray} from "core/types"
import {map, left_edge_index} from "core/util/arrayable"
import * as p from "core/properties"

export namespace LinearInterpolationScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props & {
    binning: p.Property<Arrayable<number>>
  }
}

export interface LinearInterpolationScale extends LinearInterpolationScale.Attrs {}

export class LinearInterpolationScale extends Scale {
  properties: LinearInterpolationScale.Props

  constructor(attrs?: Partial<LinearInterpolationScale.Attrs>) {
    super(attrs)
  }

  static init_LinearInterpolationScale(): void {
    this.internal<LinearInterpolationScale.Props>(({Arrayable}) => ({
      binning: [ Arrayable ],
    }))
  }

  compute(x: number): number {
    return x
  }

  v_compute(vs: Arrayable<number>): NumberArray {
    const {binning} = this

    const {start, end} = this.source_range
    const min_val = start
    const max_val = end

    const n = binning.length
    const step = (end - start)/(n - 1)
    const mapping = new Array<number>(n)
    for (let i = 0; i < n; i++) {
      mapping[i] = start + i*step
    }

    const vvs = map(vs, (v) => {
      if (v < min_val)
        return min_val
      if (v > max_val)
        return max_val
      const k = left_edge_index(v, binning)
      const b0 = binning[k]
      const b1 = binning[k+1]
      const c = (v - b0)/(b1 - b0)
      const m0 = mapping[k]
      const m1 = mapping[k+1]
      return m0 + c*(m1 - m0)
    })

    return this._linear_v_compute(vvs)
  }

  invert(xprime: number): number {
    return xprime
  }

  v_invert(xprimes: Arrayable<number>): NumberArray {
    return new NumberArray(xprimes)
  }
}
