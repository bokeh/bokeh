import tz from "timezone"

import {AbstractSlider, AbstractRangeSliderView} from "./abstract_slider"
import type {TickFormatter} from "../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class DatetimeRangeSliderView extends AbstractRangeSliderView {
  declare model: DatetimeRangeSlider
}

export namespace DatetimeRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DatetimeRangeSlider extends DatetimeRangeSlider.Attrs {}

export class DatetimeRangeSlider extends AbstractSlider {
  declare properties: DatetimeRangeSlider.Props
  declare __view_type__: DatetimeRangeSliderView

  constructor(attrs?: Partial<DatetimeRangeSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatetimeRangeSliderView

    this.override<DatetimeRangeSlider.Props>({
      format: "%d %b %Y %H:%M:%S",
      step: 3_600_000,  // 1 hour.
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
