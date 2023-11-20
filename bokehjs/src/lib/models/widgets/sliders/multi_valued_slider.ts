import type {SliderSpec} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class MultiValuedSliderView extends BaseNumericalSliderView {
  declare model: MultiValuedSlider

  protected _calc_spec(): SliderSpec<number> {
    const {start, end, step, value} = this.model
    return {
      min: start,
      max: end,
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

export namespace MultiValuedSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseNumericalSlider.Props & {
    value: p.Property<number[]>
    value_throttled: p.Property<number[]>
  }
}

export interface MultiValuedSlider extends MultiValuedSlider.Attrs {}

export abstract class MultiValuedSlider extends BaseNumericalSlider {
  declare properties: MultiValuedSlider.Props
  declare __view_type__: MultiValuedSliderView

  declare value: number[]
  declare value_throttled: number[]

  constructor(attrs?: Partial<MultiValuedSlider.Attrs>) {
    super(attrs)
  }
}
