import type {SliderSpec} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class NumericalRangeSliderView extends BaseNumericalSliderView {
  declare model: NumericalRangeSlider

  protected _calc_to(): SliderSpec<number> {
    const {start, end, value, step} = this.model

    return {
      range: {
        min: start,
        max: end,
      },
      start: value,
      step,
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
  declare declare__view_type__: NumericalRangeSliderView

  declare value: [number, number]
  declare value_throttled: [number, number]

  constructor(attrs?: Partial<NumericalRangeSlider.Attrs>) {
    super(attrs)
  }

  _enforce_value_gte_start(start: number) {
    const v = this.value.slice()
    if (v[0] < start) {
      v[0] = start
      if (v[1] < start) {
        v[1] = start
      }
      this.setv({value: v, value_throttled: v})
    }
  }

  _enforce_value_lte_end(end: number) {
    const v = this.value.slice()
    if (v[1] > end) {
      v[1] = end
      if (v[0] > end) {
        v[0] = end
      }
      this.setv({value: v, value_throttled: v})
    }
  }
}
