import {Transform} from "../transforms"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {Arrayable, NumberArray} from "core/types"
import * as p from "core/properties"

export namespace Scale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props & {
    source_range: p.Property<Range>
    target_range: p.Property<Range1d>
  }
}

export interface Scale extends Scale.Attrs {}

export abstract class Scale extends Transform {
  properties: Scale.Props

  constructor(attrs?: Partial<Scale.Attrs>) {
    super(attrs)
  }

  static init_Scale(): void {
    this.internal({
      source_range: [ p.Any ],
      target_range: [ p.Any ], // p.Instance(Range1d)
    })
  }

  abstract compute(x: number): number

  abstract v_compute(xs: Arrayable<number>): NumberArray

  abstract invert(sx: number): number

  abstract v_invert(sxs: Arrayable<number>): NumberArray

  r_compute(x0: number, x1: number): [number, number] {
    if (this.target_range.is_reversed)
      return [this.compute(x1), this.compute(x0)]
    else
      return [this.compute(x0), this.compute(x1)]
  }

  r_invert(sx0: number, sx1: number): [number, number] {
    if (this.target_range.is_reversed)
      return [this.invert(sx1), this.invert(sx0)]
    else
      return [this.invert(sx0), this.invert(sx1)]
  }

  // These are needed by both LinearScale and CategoricalScale and this is the
  // only common ancestor. TODO: Proper MI/Mixin would be better.
  _linear_compute(x: number): number {
    const [factor, offset] = this._linear_compute_state()
    return factor * x + offset
  }

  _linear_v_compute(xs: Arrayable<number>): NumberArray {
    const [factor, offset] = this._linear_compute_state()
    const result = new NumberArray(xs.length)
    for (let i = 0; i < xs.length; i++)
      result[i] = factor*xs[i] + offset
    return result
  }

  _linear_invert(xprime: number): number {
    const [factor, offset] = this._linear_compute_state()
    return (xprime - offset) / factor
  }

  _linear_v_invert(xprimes: Arrayable<number>): NumberArray {
    const [factor, offset] = this._linear_compute_state()
    const result = new NumberArray(xprimes.length)
    for (let i = 0; i < xprimes.length; i++)
      result[i] = (xprimes[i] - offset) / factor
    return result
  }

  /*protected*/ _linear_compute_state(): [number, number] {
    //
    //  (t1 - t0)       (t1 - t0)
    //  --------- * x - --------- * s0 + t0
    //  (s1 - s0)       (s1 - s0)
    //
    // [  factor  ]     [    offset    ]
    //
    const source_start = this.source_range.start
    const source_end   = this.source_range.end
    const target_start = this.target_range.start
    const target_end   = this.target_range.end
    const factor = (target_end - target_start)/(source_end - source_start)
    const offset = -(factor * source_start) + target_start
    return [factor, offset]
  }
}
