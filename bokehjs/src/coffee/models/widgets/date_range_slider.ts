/* XXX: partial */
import tz = require("timezone")

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class DateRangeSliderView extends AbstractSliderView {
  model: DateRangeSlider

  _calc_to() {
    return {
      start: this.model.start,
      end: this.model.end,
      value: this.model.value,
      step: this.model.step,
    }
  }

  _calc_from(values) {
    return values
  }
}

export namespace DateRangeSlider {
  export interface Attrs extends AbstractSlider.Attrs {}

  export interface Opts extends AbstractSlider.Opts {}
}

export interface DateRangeSlider extends DateRangeSlider.Attrs {}

export class DateRangeSlider extends AbstractSlider {

  constructor(attrs?: Partial<DateRangeSlider.Attrs>, opts?: DateRangeSlider.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "DateRangeSlider"
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
