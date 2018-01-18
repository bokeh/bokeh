/* XXX: partial */
import * as tz from "timezone"

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

export class DateSlider extends AbstractSlider {

  static initClass() {
    this.prototype.type = "DateSlider"
    this.prototype.default_view = DateSliderView

    this.override({
      format: "%d %b %Y"
    })
  }

  behaviour = 'tap'
  connected = [true, false]

  _formatter = tz
}

DateSlider.initClass()
