import tz from "timezone"

import type {SliderSpec} from "./abstract_slider"
import {NumericalSlider, NumericalSliderView} from "./numerical_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class DateSliderView extends NumericalSliderView {
  declare model: DateSlider

  override behaviour = "tap" as const
  override connected = [true, false]

  protected override _calc_to(): SliderSpec<number> {
    const spec = super._calc_to()
    spec.step *= 86_400_000
    return spec
  }

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return tz(value, format)
    } else {
      return format.compute(value)
    }
  }
}

export namespace DateSlider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = NumericalSlider.Props
}

export interface DateSlider extends DateSlider.Attrs {}

export class DateSlider extends NumericalSlider {
  declare properties: DateSlider.Props
  declare __view_type__: DateSliderView

  constructor(attrs?: Partial<DateSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DateSliderView

    this.override<DateSlider.Props>({
      format: "%d %b %Y",
    })
  }
}
