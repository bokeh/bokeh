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
  behaviour = 'tap'
  connected = [true, false]

  _formatter = tz
}

DateSlider.prototype.type = "DateSlider"
DateSlider.prototype.default_view = DateSliderView

DateSlider.override({
  format: "%d %b %Y"
})
