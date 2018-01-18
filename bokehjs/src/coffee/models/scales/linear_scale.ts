import {Scale} from "./scale"

export class LinearScale extends Scale {

  static initClass() {
    this.prototype.type = "LinearScale"
  }

  compute(x: number): number {
    const [factor, offset] = this._compute_state()
    return factor * x + offset
  }

  v_compute(xs: number[] | Float64Array): Float64Array {
    const [factor, offset] = this._compute_state()
    const result = new Float64Array(xs.length)
    for (let i = 0; i < xs.length; i++)
      result[i] = factor*xs[i] + offset
    return result
  }

  invert(xprime: number): number {
    const [factor, offset] = this._compute_state()
    return (xprime - offset) / factor
  }

  v_invert(xprimes: number[] | Float64Array): Float64Array {
    const [factor, offset] = this._compute_state()
    const result = new Float64Array(xprimes.length)
    for (let i = 0; i < xprimes.length; i++)
      result[i] = (xprimes[i] - offset) / factor
    return result
  }

  protected _compute_state(): [number, number] {
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

LinearScale.initClass()
