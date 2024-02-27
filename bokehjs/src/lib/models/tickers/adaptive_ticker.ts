import {ContinuousTicker} from "./continuous_ticker"
import {argmin, nth} from "core/util/array"
import {clamp, log} from "core/util/math"
import type * as p from "core/properties"

// This Ticker produces nice round ticks at any magnitude.
// AdaptiveTicker([1, 2, 5]) will choose the best tick interval from the
// following:
// ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...
export namespace AdaptiveTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousTicker.Props & {
    base: p.Property<number>
    mantissas: p.Property<number[]>
    min_interval: p.Property<number>
    max_interval: p.Property<number | null> // XXX: null -> Infinity, but can't serialize currently
  }
}

export interface AdaptiveTicker extends AdaptiveTicker.Attrs {}

export class AdaptiveTicker extends ContinuousTicker {
  declare properties: AdaptiveTicker.Props

  constructor(attrs?: Partial<AdaptiveTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AdaptiveTicker.Props>(({Float, List, Nullable}) => ({
      base:         [ Float, 10.0 ],
      mantissas:    [ List(Float), [1, 2, 5] ],
      min_interval: [ Float, 0.0 ],
      max_interval: [ Nullable(Float), null ],
    }))
  }

  get_min_interval(): number {
    return this.min_interval
  }

  get_max_interval(): number {
    return this.max_interval ?? Infinity
  }

  // These arguments control the range of possible intervals. The interval I
  // returned by get_interval() will be the one that most closely matches the
  // desired number of ticks, subject to the following constraints:
  // I = (M * B^N), where
  // M is a member of mantissas,
  // B is base,
  // and N is an integer;
  // and min_interval <= I <= max_interval.
  get extended_mantissas(): number[] {
    const prefix_mantissa = nth(this.mantissas, -1) / this.base
    const suffix_mantissa = nth(this.mantissas,  0) * this.base
    return [prefix_mantissa, ...this.mantissas, suffix_mantissa]
  }

  get base_factor(): number {
    return this.get_min_interval() == 0.0 ? 1.0 : this.get_min_interval()
  }

  get_interval(data_low: number, data_high: number, desired_n_ticks: number): number {
    const data_range = data_high - data_low
    const ideal_interval = this.get_ideal_interval(data_low, data_high, desired_n_ticks)

    const interval_exponent = Math.floor(log(ideal_interval / this.base_factor, this.base))
    const ideal_magnitude = this.base**interval_exponent * this.base_factor

    // An untested optimization.
    //   const ideal_mantissa = ideal_interval / ideal_magnitude
    //   index = sorted_index(this.extended_mantissas, ideal_mantissa)
    //   candidate_mantissas = this.extended_mantissas[index..index + 1]
    const candidate_mantissas = this.extended_mantissas

    const errors = candidate_mantissas.map((mantissa) => {
      return Math.abs(desired_n_ticks - (data_range / (mantissa * ideal_magnitude)))
    })
    const best_mantissa = candidate_mantissas[argmin(errors)]
    const interval = best_mantissa*ideal_magnitude

    return clamp(interval, this.get_min_interval(), this.get_max_interval())
  }
}
