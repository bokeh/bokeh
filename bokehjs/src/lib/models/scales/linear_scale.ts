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
    const {source_range: source, target_range: target} = this
    const [factor, offset] = LinearScale.linear_compute(source.start, source.end, target.start, target.end)
    return (x) => factor*x + offset
  }

  get s_invert(): (sx: number) => number {
    const {source_range: source, target_range: target} = this
    const [factor, offset] = LinearScale.linear_compute(source.start, source.end, target.start, target.end)
    return (sx) => (sx - offset) / factor
  }

  static linear_compute(source_start: number, source_end: number, target_start: number, target_end: number): [number, number] {
    //
    //  (t1 - t0)       (t1 - t0)
    //  --------- * x - --------- * s0 + t0
    //  (s1 - s0)       (s1 - s0)
    //
    // [  factor  ]     [    offset    ]
    //
    const factor = (target_end - target_start)/(source_end - source_start)
    const offset = -(factor * source_start) + target_start
    return [factor, offset]
  }
}
