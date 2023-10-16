import {Transform} from "../transforms/transform"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import type {Arrayable, FloatArray} from "core/types"
import {ScreenArray} from "core/types"
import type * as p from "core/properties"

export namespace Scale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props & {
    source_range: p.Property<Range>
    target_range: p.Property<Range1d>
  }
}

export interface Scale<T = number> extends Scale.Attrs {}

export abstract class Scale<T = number> extends Transform<T, number> {
  declare properties: Scale.Props

  constructor(attrs?: Partial<Scale.Attrs>) {
    super(attrs)
  }

  static {
    this.internal<Scale.Props>(({Ref}) => ({
      source_range: [ Ref(Range) ],
      target_range: [ Ref(Range1d) ],
    }))
  }

  abstract get s_compute(): (x: T) => number

  abstract get s_invert(): (sx: number) => number

  compute(x: T): number {
    return this.s_compute(x)
  }

  v_compute(xs: Arrayable<T>): ScreenArray {
    const result = new ScreenArray(xs.length)
    const {s_compute} = this
    for (let i = 0; i < xs.length; i++) {
      result[i] = s_compute(xs[i])
    }
    return result
  }

  invert(sx: number): number {
    return this.s_invert(sx)
  }

  v_invert(sxs: Arrayable<number>): FloatArray {
    const result = new Float64Array(sxs.length)
    const {s_invert} = this
    for (let i = 0; i < sxs.length; i++) {
      result[i] = s_invert(sxs[i])
    }
    return result
  }

  r_compute(x0: T, x1: T): [number, number] {
    const {s_compute} = this
    if (this.target_range.is_reversed) {
      return [s_compute(x1), s_compute(x0)]
    } else {
      return [s_compute(x0), s_compute(x1)]
    }
  }

  r_invert(sx0: number, sx1: number): [number, number] {
    const {s_invert} = this
    if (this.target_range.is_reversed) {
      return [s_invert(sx1), s_invert(sx0)]
    } else {
      return [s_invert(sx0), s_invert(sx1)]
    }
  }
}
