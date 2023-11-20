import type {SliderSpec} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type * as p from "core/properties"

export abstract class NumericalSliderView extends BaseNumericalSliderView {
  declare model: NumericalSlider

  protected _calc_spec(): SliderSpec<number> {
    const {start, end, value, step} = this.model
    return {
      min: start,
      max: end,
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

  constructor(attrs?: Partial<NumericalSlider.Attrs>) {
    super(attrs)
  }
}
