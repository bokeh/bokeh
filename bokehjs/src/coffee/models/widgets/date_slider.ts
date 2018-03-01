/* XXX: partial */
import tz = require("timezone")

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class DateSliderView extends AbstractSliderView {
  model: DateSlider

  _calc_to() {
    return {
      start: this.model.start,
      end: this.model.end,
      value: [this.model.value],
      step: this.model.step,
    }
  }

  _calc_from([value]) {
    return value
  }
}

export namespace DateSlider {
  export interface Attrs extends AbstractSlider.Attrs {}

  export interface Opts extends AbstractSlider.Opts {}
}

export interface DateSlider extends DateSlider.Attrs {}

export class DateSlider extends AbstractSlider {

  constructor(attrs?: Partial<DateSlider.Attrs>, opts?: DateSlider.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "DateSlider"
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

DateSlider.initClass()
