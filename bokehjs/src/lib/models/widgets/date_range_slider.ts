import tz from "timezone"

import type {SliderSpec} from "./abstract_slider"
import {AbstractSlider, AbstractRangeSliderView} from "./abstract_slider"
import type {TickFormatter} from "../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class DateRangeSliderView extends AbstractRangeSliderView {
  declare model: DateRangeSlider

  protected override _calc_to(): SliderSpec {
    const {start, end, value, step} = this.model
    return {
      start,
      end,
      value,
      step: step * 86_400_000,
    }
  }

}

export namespace DateRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateRangeSlider extends DateRangeSlider.Attrs {}

export class DateRangeSlider extends AbstractSlider {
  declare properties: DateRangeSlider.Props
  declare __view_type__: DateRangeSliderView

  constructor(attrs?: Partial<DateRangeSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DateRangeSliderView

    this.override<DateRangeSlider.Props>({
      format: "%d %b %Y",
    })
  }

  override behaviour = "drag" as "drag"
  override connected = [false, true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format))
      return tz(value, format)
    else
      return format.compute(value)
  }
}
