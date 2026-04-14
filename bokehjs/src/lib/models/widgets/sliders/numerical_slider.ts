import type {SliderSpec} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class NumericalSliderView extends BaseNumericalSliderView {
  declare readonly model: NumericalSlider
  declare readonly signals: p.SignalsOf<NumericalSlider.Props>
  declare readonly values: NumericalSlider.Attrs

  protected _calc_spec(): SliderSpec<number> {
    const {start, end, value, step} = this.values
    return {
      start,
      end,
      values: [value],
      step,
      compute: (value: number) => value,
      invert: (synthetic: number) => synthetic,
    }
  }

  protected _calc_to(value: number): number[] {
    return [value]
  }
  protected _calc_from([value]: number[]): number {
    return value
  }
}

export namespace NumericalSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseNumericalSlider.Props & {
    value: p.Property<number>
    value_throttled: p.Property<number>
  }
}

export interface NumericalSlider extends NumericalSlider.Attrs {}

export abstract class NumericalSlider extends BaseNumericalSlider {
  declare properties: NumericalSlider.Props
  declare __view_type__: NumericalSliderView

  declare value: number
  declare value_throttled: number

  protected _clamp(value: number): number {
    const [lo, hi] = this._bounds()
    return Math.min(Math.max(value, lo), hi)
  }

  protected _enforce_bounds(): void {
    const {value, value_throttled} = this.properties
    const changes: Partial<{value: number, value_throttled: number}> = {}

    if (!value.is_unset) {
      const v = this.value
      const clamped = this._clamp(v)
      if (clamped != v) {
        changes.value = clamped
      }
    }

    if (!value_throttled.is_unset) {
      const t = this.value_throttled
      const clamped = this._clamp(t)
      if (clamped != t) {
        changes.value_throttled = clamped
      }
    } else if (changes.value != null) {
      changes.value_throttled = changes.value
    }

    if (changes.value != null || changes.value_throttled != null) {
      this.setv(changes)
    }
  }
}
