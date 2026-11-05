import type {SliderSpec, SliderKind} from "./abstract_slider"
import {range_kind} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"
import {clamp} from "core/util/math"

export abstract class NumericalRangeSliderView extends BaseNumericalSliderView {
  declare readonly model: NumericalRangeSlider
  declare readonly signals: p.SignalsOf<NumericalRangeSlider.Props>
  declare readonly values: NumericalRangeSlider.Attrs

  protected get kind(): SliderKind {
    return range_kind
  }

  protected _calc_spec(): SliderSpec<number> {
    const {start, end, step} = this.values
    return {
      start,
      end,
      step,
      compute: (value: number) => value,
      invert: (synthetic: number) => synthetic,
    }
  }

  protected _calc_values(): number[] {
    return this.values.value
  }

  protected _calc_from(values: number[]): number[] {
    return values
  }
}

export namespace NumericalRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseNumericalSlider.Props & {
    value: p.Property<[number, number]>
    value_throttled: p.Property<[number, number]>
  }
}

export interface NumericalRangeSlider extends NumericalRangeSlider.Attrs {}

export abstract class NumericalRangeSlider extends BaseNumericalSlider {
  declare properties: NumericalRangeSlider.Props
  declare __view_type__: NumericalRangeSliderView

  declare value: [number, number]
  declare value_throttled: [number, number]

  protected _enforce_bounds(): void {
    const changes: {value?: [number, number], value_throttled?: [number, number]} = {}
    const [lo, hi] = this._bounds()

    if (!this.properties.value.is_unset) {
      const [v0, v1] = this.value
      const cv0 = clamp(v0, lo, hi)
      const cv1 = clamp(v1, lo, hi)
      if (cv0 != v0 || cv1 != v1) {
        changes.value = [cv0, cv1]
      }
    }

    if (!this.properties.value_throttled.is_unset) {
      const [t0, t1] = this.value_throttled
      const ct0 = clamp(t0, lo, hi)
      const ct1 = clamp(t1, lo, hi)
      if (ct0 != t0 || ct1 != t1) {
        changes.value_throttled = [ct0, ct1]
      }
    } else if (changes.value != null) {
      // copy, so that `value` and `value_throttled` never share one array
      changes.value_throttled = [...changes.value]
    }

    if (changes.value != null || changes.value_throttled != null) {
      this.setv(changes)
    }
  }
}
