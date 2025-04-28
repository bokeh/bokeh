import type {SliderSpec} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class NumericalSliderView extends BaseNumericalSliderView {
  declare model: NumericalSlider

  protected _calc_to(): SliderSpec<number> {
    const {start, end, value, step} = this.model
    return {
      range: {
        min: start,
        max: end,
      },
      start: [value],
      step,
    }
  }

  protected _calc_from([value]: number[]): number {
    if (Number.isInteger(this.model.start) && Number.isInteger(this.model.end) && Number.isInteger(this.model.step)) {
      return Math.round(value)
    } else {
      return value
    }
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

  constructor(attrs?: Partial<NumericalSlider.Attrs>) {
    super(attrs)
  }

  _enforce_value_gte_start(start: number) {
    const {value} = this
    if (value < start) {
      this.properties.value.set_value(start)
      this.properties.value_throttled.set_value(start)
    }
  }

  _enforce_value_lte_end(end: number) {
    const {value} = this
    if (value > end) {
      this.properties.value.set_value(end)
      this.properties.value_throttled.set_value(end)
    }
  }
}
