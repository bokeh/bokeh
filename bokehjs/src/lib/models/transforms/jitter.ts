import {RangeTransform} from "./range_transform"
import type {Factor} from "../ranges/factor_range"
import {FactorRange} from "../ranges/factor_range"
import {RandomGenerator} from "../random/random_generator"
import {Distribution} from "core/enums"
import type {Arrayable} from "core/types"
import {map} from "core/util/arrayable"
import type * as p from "core/properties"
import type {AbstractRandom} from "core/util/random"
import {SystemRandom} from "core/util/random"

export namespace Jitter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RangeTransform.Props & {
    mean: p.Property<number>
    width: p.Property<number>
    distribution: p.Property<Distribution>
    /** internal */
    random_generator: p.Property<RandomGenerator | null>
  }
}

export interface Jitter extends Jitter.Attrs {}

export class Jitter extends RangeTransform {
  declare properties: Jitter.Props

  protected _previous_offsets: Float64Array | null = null

  constructor(attrs?: Partial<Jitter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Jitter.Props>(({Float}) => ({
      mean:         [ Float, 0 ],
      width:        [ Float, 1 ],
      distribution: [ Distribution, "uniform" ],
    }))

    this.internal<Jitter.Props>(({Nullable, Ref}) => ({
      random_generator: [ Nullable(Ref(RandomGenerator)), null ],
    }))
  }

  protected _generator: AbstractRandom

  override initialize(): void {
    super.initialize()
    this._generator = this.random_generator?.generator() ?? new SystemRandom()
  }

  override v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    const xs: Arrayable<number> = (() => {
      if (this.range instanceof FactorRange) {
        return this.range.v_synthetic(xs0)
      } else {
        return xs0 as Arrayable<number>
      }
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
    const {mean, width} = this
    switch (this.distribution) {
      case "uniform": return this._generator.uniform(mean, width)
      case "normal":  return this._generator.normal(mean, width)
    }
  }

  protected _v_compute(n: number): Float64Array {
    const {mean, width} = this
    switch (this.distribution) {
      case "uniform": return this._generator.uniforms(mean, width, n)
      case "normal":  return this._generator.normals(mean, width, n)
    }
  }
}
