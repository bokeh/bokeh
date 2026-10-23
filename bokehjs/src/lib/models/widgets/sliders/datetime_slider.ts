import {NumericalSlider, NumericalSliderView} from "./numerical_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import {datetime} from "core/util/templating"

export class DatetimeSliderView extends NumericalSliderView {
  declare model: DatetimeSlider

  override behaviour = "tap" as const
  override connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return datetime(value, format)
    } else {
      return format.compute(value)
    }
  }
}

export namespace DatetimeSlider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = NumericalSlider.Props
}

export interface DatetimeSlider extends DatetimeSlider.Attrs {}

export class DatetimeSlider extends NumericalSlider {
  declare properties: DatetimeSlider.Props
  declare __view_type__: DatetimeSliderView

  constructor(attrs?: Partial<DatetimeSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatetimeSliderView

    this.override<DatetimeSlider.Props>({
      format: "%d %b %Y %H:%M:%S",
      step: 3_600_000,  // 1 hour
    })
  }
}
