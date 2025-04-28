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
    const {value} = this
    if (value[0] < start) {
      value[0] = start
      if (value[1] < start) { value[1] = start }
      this.properties.value.set_value(value)
      this.properties.value_throttled.set_value(value)
    }
  }

  _enforce_value_lte_end(end: number) {
    const {value} = this
    if (value[1] > end) {
      if (value[0] > end) { value[0] = end }
      value[1] = end
      this.properties.value.set_value(value)
      this.properties.value_throttled.set_value(value)
    }
  }
}
