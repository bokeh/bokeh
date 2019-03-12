import {Scale} from "./scale"
import {Arrayable} from "core/types"
import {linspace} from "core/util/array"
import {interp, norm, map} from "core/util/arrayable"
import * as p from "core/properties"

export namespace LinearInterpolationScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props & {
    scan_result: p.Property<Arrayable<number>>
  }
}

export interface LinearInterpolationScale extends LinearInterpolationScale.Attrs {}

export class LinearInterpolationScale extends Scale {
  properties: LinearInterpolationScale.Props

  constructor(attrs?: Partial<LinearInterpolationScale.Attrs>) {
    super(attrs)
  }

  static init_LinearInterpolationScale(): void {
    this.internal({scan_result: [ p.Array ]})
  }

  compute(x: number): number {
    return x
  }

  v_compute(xs: number[]): Arrayable<number> {
    const norm_xs = norm(xs, this.source_range.start, this.source_range.end)
    const edges_norm = linspace(0, 1, this.scan_result.length)
    const interpolated = interp(norm_xs, edges_norm, this.scan_result)
    const norm_interp = norm(interpolated, this.source_range.start, this.source_range.end)
    const target_span = this.target_range.end - this.target_range.start
    return map(norm_interp, (x) => this.target_range.start + x*target_span)
  }

  invert(xprime: number): number {
    return xprime
  }

  v_invert(xprimes: Arrayable<number>): Arrayable<number> {
    return xprimes
  }
}
