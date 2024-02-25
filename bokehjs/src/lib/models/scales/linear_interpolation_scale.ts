import {Scale} from "./scale"
import {LinearScale} from "./linear_scale"
import type {Arrayable, ScreenArray, FloatArray} from "core/types"
import {map, left_edge_index} from "core/util/arrayable"
import type * as p from "core/properties"

export namespace LinearInterpolationScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props & {
    binning: p.Property<Arrayable<number>>
    linear_scale: p.Property<LinearScale>
  }
}

export interface LinearInterpolationScale extends LinearInterpolationScale.Attrs {}

export class LinearInterpolationScale extends Scale<number> {
  declare properties: LinearInterpolationScale.Props

  constructor(attrs?: Partial<LinearInterpolationScale.Attrs>) {
    super(attrs)
  }

  static {
    this.internal<LinearInterpolationScale.Props>(({Float, Arrayable, Ref}) => ({
      binning:      [ Arrayable(Float) ],
      linear_scale: [ Ref(LinearScale) ],
    }))
  }

  override initialize(): void {
    super.initialize()

    const {source_range, target_range} = this.properties
    if (!source_range.is_unset && !target_range.is_unset) {
      this.linear_scale = new LinearScale({
        source_range: source_range.get_value(),
        target_range: target_range.get_value(),
      })
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    const {source_range, target_range} = this.properties
    this.on_change([source_range, target_range], () => {
      this.linear_scale = new LinearScale({
        source_range: this.source_range,
        target_range: this.target_range,
      })
    })
  }

  get s_compute(): (x: number) => number {
    throw new Error("not implemented")
  }

  get s_invert(): (sx: number) => number {
    throw new Error("not implemented")
  }

  override compute(x: number): number {
    return x
  }

  override v_compute(vs: Arrayable<number>): ScreenArray {
    const {binning} = this

    const {start, end} = this.source_range
    const min_val = start
    const max_val = end

    const n = binning.length
    const step = (end - start)/(n - 1)
    const mapping = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      mapping[i] = start + i*step
    }

    const vvs = map(vs, (v) => {
      if (v < min_val) {
        return min_val
      }
      if (v > max_val) {
        return max_val
      }
      const k = left_edge_index(v, binning)
      if (k == -1) {
        return min_val
      }
      if (k >= n - 1) {
        return max_val
      }
      const b0 = binning[k]
      const b1 = binning[k+1]
      const c = (v - b0)/(b1 - b0)
      const m0 = mapping[k]
      const m1 = mapping[k+1]
      return m0 + c*(m1 - m0)
    })

    return this.linear_scale.v_compute(vvs)
  }

  override invert(xprime: number): number {
    return xprime
  }

  override v_invert(xprimes: Arrayable<number>): FloatArray {
    return new Float64Array(xprimes)
  }
}
