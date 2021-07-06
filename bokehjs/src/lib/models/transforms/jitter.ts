import {RangeTransform} from "./range_transform"
import {Factor, FactorRange} from "../ranges/factor_range"
import {Distribution} from "core/enums"
import {Arrayable} from "core/types"
import {isNumber, isArrayableOf} from "core/util/types"
import {map} from "core/util/arrayable"
import * as p from "core/properties"
import * as bokeh_math from "core/util/math"
import {unreachable} from "core/util/assert"

export namespace Jitter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RangeTransform.Props & {
    mean: p.Property<number>
    width: p.Property<number>
    distribution: p.Property<Distribution>
  }
}

export interface Jitter extends Jitter.Attrs {}

export class Jitter extends RangeTransform {
  override properties: Jitter.Props

  previous_offsets: Arrayable<number> | undefined

  constructor(attrs?: Partial<Jitter.Attrs>) {
    super(attrs)
  }

  static init_Jitter(): void {
    this.define<Jitter.Props>(({Number}) => ({
      mean:         [ Number, 0 ],
      width:        [ Number, 1 ],
      distribution: [ Distribution, "uniform" ],
    }))
  }

  override v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    let xs: Arrayable<number>
    if (this.range instanceof FactorRange)
      xs = this.range.v_synthetic(xs0)
    else if (isArrayableOf(xs0, isNumber))
      xs = xs0
    else
      unreachable()

    const xs_length = xs.length

    if (this.previous_offsets?.length != xs_length) {
      this.previous_offsets = this._compute_offsets(xs_length)
    }

    const offsets = this.previous_offsets
    return map(xs, (xs, i) => offsets[i] + xs)
  }

  protected _compute_offsets(xs_length: number): Arrayable<number> {
    const offsets = new Array<number>(xs_length)
    switch (this.distribution) {
      case "uniform":
        return map(offsets, () => this.mean + (bokeh_math.random() - 0.5)*this.width)
      case "normal":
        return map(offsets, () => bokeh_math.rnorm(this.mean, this.width))
    }
  }
}
