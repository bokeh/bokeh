import * as numbro from "@bokeh/numbro"

import type {SliderSpec, SliderKind} from "./abstract_slider"
import {multi_kind} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

// TODO make this configurable; unordered handles are supported with `multi_kind({ordered: false})`
const ordered_kind = multi_kind({ordered: true})

export class MultiValuedSliderView extends BaseNumericalSliderView {
  declare readonly model: MultiValuedSlider
  declare readonly signals: p.SignalsOf<MultiValuedSlider.Props>
  declare readonly values: MultiValuedSlider.Attrs

  protected get kind(): SliderKind {
    return ordered_kind
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

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return numbro.format(value, format)
    } else {
      return format.compute(value)
    }
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

export class MultiValuedSlider extends BaseNumericalSlider {
  declare properties: MultiValuedSlider.Props
  declare __view_type__: MultiValuedSliderView

  declare value: number[]
  declare value_throttled: number[]

  static {
    this.prototype.default_view = MultiValuedSliderView

    this.override<MultiValuedSlider.Props>({
      format: "0[.]00",
    })
  }
}
