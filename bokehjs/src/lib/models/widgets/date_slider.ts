import tz from "timezone"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import {TickFormatter} from "../formatters/tick_formatter"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class DateSliderView extends AbstractSliderView {
  override model: DateSlider
}

export namespace DateSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateSlider extends DateSlider.Attrs {}

export class DateSlider extends AbstractSlider {
  override properties: DateSlider.Props
  override __view_type__: DateSliderView

  constructor(attrs?: Partial<DateSlider.Attrs>) {
    super(attrs)
  }

  static init_DateSlider(): void {
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
