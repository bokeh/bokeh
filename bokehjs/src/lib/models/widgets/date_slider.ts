import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import tz from "core/util/timezone"
import * as p from "core/properties"

export class DateSliderView extends AbstractSliderView {
  model: DateSlider
}

export namespace DateSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface DateSlider extends DateSlider.Attrs {}

export class DateSlider extends AbstractSlider {
  properties: DateSlider.Props

  constructor(attrs?: Partial<DateSlider.Attrs>) {
    super(attrs)
  }

  static init_DateSlider(): void {
    this.prototype.default_view = DateSliderView

    this.override({
      format: "%d %b %Y",
    })
  }

  behaviour = "tap" as "tap"
  connected = [true, false]

  protected _formatter(value: number, format: string): string {
    return tz(value, format)
  }
}
