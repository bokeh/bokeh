import {Scale} from "./scale"
import {Arrayable, NumberArray} from "core/types"
import {linspace} from "core/util/array"
import {interpolate, norm, map} from "core/util/arrayable"
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
    this.internal({binning: [ p.Array ]})
  }

  compute(x: number): number {
    return x
  }

  v_compute(xs: Arrayable<number>): NumberArray {
    const norm_xs = norm(xs, this.source_range.start, this.source_range.end)
    const edges_norm = linspace(0, 1, this.binning.length)
    const interpolated = interpolate(norm_xs, edges_norm, this.binning)
    const norm_interp = norm(interpolated, this.source_range.start, this.source_range.end)
    const target_span = this.target_range.end - this.target_range.start
    const sxs = map(norm_interp, (x) => this.target_range.start + x*target_span)
    return new NumberArray(sxs)
  }

  invert(xprime: number): number {
    return xprime
  }

  v_invert(xprimes: Arrayable<number>): NumberArray {
    return new NumberArray(xprimes)
  }
}
