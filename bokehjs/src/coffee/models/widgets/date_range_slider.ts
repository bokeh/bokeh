/* XXX: partial */
import * as tz from "timezone"

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

export class DateRangeSlider extends AbstractSlider {
  behaviour = 'drag'
  connected = [false, true, false]

  _formatter = tz
}

DateRangeSlider.prototype.type = "DateRangeSlider"
DateRangeSlider.prototype.default_view = DateRangeSliderView

DateRangeSlider.override({
  format: "%d %b %Y"
})
