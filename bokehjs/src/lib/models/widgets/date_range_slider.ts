import tz from "timezone"

import {AbstractSlider, AbstractRangeSliderView, SliderSpec} from "./abstract_slider"
import {TickFormatter} from "../formatters/tick_formatter"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class DateRangeSliderView extends AbstractRangeSliderView {
  override model: DateRangeSlider

  protected override _calc_to(): SliderSpec {
    return {
      start: this.model.start,
      end: this.model.end,
      value: this.model.value,
      step: this.model.step * 86_400_000,
    }
  }

}

export namespace DateRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateRangeSlider extends DateRangeSlider.Attrs {}

export class DateRangeSlider extends AbstractSlider {
  override properties: DateRangeSlider.Props
  override __view_type__: DateRangeSliderView

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
