import {RangeTransform} from "./range_transform"
import {Factor, FactorRange} from "../ranges/factor_range"
import {Distribution} from "core/enums"
import {Arrayable} from "core/types"
import {map} from "core/util/arrayable"
import * as p from "core/properties"
import {random, rnorm} from "core/util/math"

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

  protected _previous_offsets: Float64Array | null = null

  constructor(attrs?: Partial<Jitter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Jitter.Props>(({Number}) => ({
      mean:         [ Number, 0 ],
      width:        [ Number, 1 ],
      distribution: [ Distribution, "uniform" ],
    }))
  }

  override v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    const xs: Arrayable<number> = (() => {
      if (this.range instanceof FactorRange)
        return this.range.v_synthetic(xs0)
      else
        return xs0 as Arrayable<number>
    })()

    const offsets = (() => {
      const xs_length = xs.length
      if (this._previous_offsets?.length != xs_length) {
        this._previous_offsets = this._v_compute(xs_length)
      }
      return this._previous_offsets
    })()

    return map(offsets, (offset, i) => offset + xs[i])
  }

  protected _compute(): number {
    switch (this.distribution) {
      case "uniform":
        return this.mean + (random() - 0.5)*this.width
      case "normal":
        return rnorm(this.mean, this.width)
    }
  }

  protected _v_compute(n: number): Float64Array {
    return Float64Array.from({length: n}, () => this._compute())
  }
}
