import tz from "timezone"

import {AbstractSlider, AbstractRangeSliderView} from "./abstract_slider"
import {TickFormatter} from "../formatters/tick_formatter"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class DateRangeSliderView extends AbstractRangeSliderView {
  model: DateRangeSlider

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format))
      return tz(value, format)
    else
      return this._formatter_view!.compute(value)
  }
}

export namespace DateRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateRangeSlider extends DateRangeSlider.Attrs {}

export class DateRangeSlider extends AbstractSlider {
  properties: DateRangeSlider.Props
  __view_type__: DateRangeSliderView

  constructor(attrs?: Partial<DateRangeSlider.Attrs>) {
    super(attrs)
  }

  static init_DateRangeSlider(): void {
    this.prototype.default_view = DateRangeSliderView

    this.override<DateRangeSlider.Props>({
      format: "%d %b %Y",
    })
  }

  behaviour = "drag" as "drag"
  connected = [false, true, false]
}
