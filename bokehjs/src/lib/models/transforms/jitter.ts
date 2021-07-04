import {RangeTransform} from "./range_transform"
import {Factor, FactorRange} from "../ranges/factor_range"
import {Distribution} from "core/enums"
import {Arrayable, infer_type} from "core/types"
import {isNumber, isArrayableOf} from "core/util/types"
import * as p from "core/properties"
import * as bokeh_math from "core/util/math"

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

  previous_offsets: Arrayable<number>

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
    if (super.range instanceof FactorRange)
      xs = super.range.v_synthetic(xs0)
    else if (isArrayableOf(xs0, isNumber))
      xs = xs0
    else
      throw new Error("unexpected")

    if (this.previous_offsets != null && this.previous_offsets.length == xs.length) {
      const result = new (infer_type(xs))(xs.length)
      for (let i = 0; i < xs.length; i++) {
        result[i] = this.previous_offsets[i] + xs[i]
      }
      return result
    }

    const computed_values = super.v_compute(xs)
    this.previous_offsets = new (infer_type(xs))(xs.length)
    for (let i = 0; i < xs.length; i++) {
      this.previous_offsets[i] = computed_values[i] - xs[i]
    }
    return this.previous_offsets
  }

  protected _compute(x: number): number {
    switch (this.distribution) {
      case "uniform":
        return x + this.mean + (bokeh_math.random() - 0.5)*this.width
      case "normal":
        return x + bokeh_math.rnorm(this.mean, this.width)
    }
  }
}
