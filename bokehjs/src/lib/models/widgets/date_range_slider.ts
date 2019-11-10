import {AbstractSlider, AbstractRangeSliderView} from "./abstract_slider"
import tz from "core/util/timezone"
import * as p from "core/properties"

export class DateRangeSliderView extends AbstractRangeSliderView {
  model: DateRangeSlider
}

export namespace DateRangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateRangeSlider extends DateRangeSlider.Attrs {}

export class DateRangeSlider extends AbstractSlider {
  properties: DateRangeSlider.Props

  constructor(attrs?: Partial<DateRangeSlider.Attrs>) {
    super(attrs)
  }

  static init_DateRangeSlider(): void {
    this.prototype.default_view = DateRangeSliderView

    this.override({
      format: "%d %b %Y",
    })
  }

  behaviour = "drag" as "drag"
  connected = [false, true, false]

  protected _formatter(value: number, format: string): string {
    return tz(value, format)
  }
}
