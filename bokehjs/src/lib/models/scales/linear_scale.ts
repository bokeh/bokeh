import {ContinuousScale} from "./continuous_scale"
import type * as p from "core/properties"

export namespace LinearScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousScale.Props
}

export interface LinearScale extends LinearScale.Attrs {}

export class LinearScale extends ContinuousScale {
  declare properties: LinearScale.Props

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
