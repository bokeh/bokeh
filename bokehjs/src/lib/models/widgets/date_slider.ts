import tz from "timezone"

import type {SliderSpec} from "./abstract_slider"
import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import type {TickFormatter} from "../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class DateSliderView extends AbstractSliderView {
  declare model: DateSlider

  protected override _calc_to(): SliderSpec {
    const {start, end, value, step} = this.model
    return {
      start,
      end,
      value: [value],
      step: step * 86_400_000,
    }
  }
}

export namespace DateSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateSlider extends DateSlider.Attrs {}

export class DateSlider extends AbstractSlider {
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

  override behaviour = "tap" as "tap"
  override connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format))
      return tz(value, format)
    else
      return format.compute(value)
  }
}
