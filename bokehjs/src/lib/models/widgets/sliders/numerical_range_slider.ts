import type {SliderSpec, SliderKind} from "./abstract_slider"
import {range_kind} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class NumericalRangeSliderView extends BaseNumericalSliderView {
  declare readonly model: NumericalRangeSlider
  declare readonly signals: p.SignalsOf<NumericalRangeSlider.Props>
  declare readonly values: NumericalRangeSlider.Attrs

  protected get kind(): SliderKind {
    return range_kind
  }

  protected _calc_spec(): SliderSpec<number> {
    const {start, end, step, value} = this.values
    return {
      start,
      end,
      values: value,
      step,
      compute: (value: number) => value,
      invert: (synthetic: number) => synthetic,
    }
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

  protected _clamp(value: [number, number]): [number, number] {
    const [lo, hi] = this._bounds()
    const clamp = (v: number) => Math.min(Math.max(v, lo), hi)
    return [clamp(value[0]), clamp(value[1])]
  }

  protected _enforce_bounds(): void {
    const {value, value_throttled} = this.properties
    const changes: Partial<{value: [number, number], value_throttled: [number, number]}> = {}

    if (!value.is_unset) {
      const [v0, v1] = this.value
      const clamped = this._clamp([v0, v1])
      if (clamped[0] != v0 || clamped[1] != v1) {
        changes.value = clamped
      }
    }

    if (!value_throttled.is_unset) {
      const [t0, t1] = this.value_throttled
      const clamped = this._clamp([t0, t1])
      if (clamped[0] != t0 || clamped[1] != t1) {
        changes.value_throttled = clamped
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
