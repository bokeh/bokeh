import type {SliderSpec} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class NumericalRangeSliderView extends BaseNumericalSliderView {
  declare model: NumericalRangeSlider

  protected _calc_to(): SliderSpec<number> {
    return {
      range: {
        min: this.model.start,
        max: this.model.end,
      },
      start: this.model.value,
      step: this.model.step,
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
}
