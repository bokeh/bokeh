import {Scale} from "./scale"
import {LinearScale} from "./linear_scale"
import {Arrayable, ScreenArray, FloatArray} from "core/types"
import {map, left_edge_index} from "core/util/arrayable"
import * as p from "core/properties"

export namespace LinearInterpolationScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props & {
    binning: p.Property<Arrayable<number>>
    linear_scale: p.Property<LinearScale>
  }
}

export interface LinearInterpolationScale extends LinearInterpolationScale.Attrs {}

export class LinearInterpolationScale extends Scale<number> {
  override properties: LinearInterpolationScale.Props

  constructor(attrs?: Partial<LinearInterpolationScale.Attrs>) {
    super(attrs)
  }

  static init_LinearInterpolationScale(): void {
    this.internal<LinearInterpolationScale.Props>(({Arrayable, Ref}) => ({
      binning:      [ Arrayable ],
      linear_scale: [
        Ref(LinearScale),
        (self) => new LinearScale({
          source_range: (self as LinearInterpolationScale).source_range,
          target_range: (self as LinearInterpolationScale).target_range,
        }),
      ],
    }))
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

    return this.linear_scale.v_compute(vvs)
  }

  override invert(xprime: number): number {
    return xprime
  }

  override v_invert(xprimes: Arrayable<number>): FloatArray {
    return new Float64Array(xprimes)
  }
}
