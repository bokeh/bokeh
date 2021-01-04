import tz from "timezone"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import {TickFormatter} from "../formatters/tick_formatter"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class DateSliderView extends AbstractSliderView {
  model: DateSlider

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format))
      return tz(value, format)
    else
      return this._formatter_view!.compute(value)
  }
}

export namespace DateSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateSlider extends DateSlider.Attrs {}

export class DateSlider extends AbstractSlider {
  properties: DateSlider.Props
  __view_type__: DateSliderView

  constructor(attrs?: Partial<DateSlider.Attrs>) {
    super(attrs)
  }

  static init_DateSlider(): void {
    this.prototype.default_view = DateSliderView

    this.override<DateSlider.Props>({
      format: "%d %b %Y",
    })
  }

  behaviour = "tap" as "tap"
  connected = [true, false]
}
