import tz = require("timezone")

import {AbstractSlider, AbstractSliderView, SliderSpec} from "./abstract_slider"
import * as p from "core/properties"

export class DateRangeSliderView extends AbstractSliderView {
  model: DateRangeSlider

  protected _calc_to(): SliderSpec {
    return {
      start: this.model.start,
      end: this.model.end,
      value: this.model.value,
      step: this.model.step,
    }
  }

  protected _calc_from(values: number[]): number[] {
    return values
  }
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

  static initClass(): void {
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
DateRangeSlider.initClass()
