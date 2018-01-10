/* XXX: partial */
import {format} from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class RangeSliderView extends AbstractSliderView {
  model: RangeSlider

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

export class RangeSlider extends AbstractSlider {
  behaviour: 'drag'
  connected: [false, true, false]

  _formatter: format
}

RangeSlider.prototype.type = "RangeSlider"
RangeSlider.prototype.default_view = RangeSliderView

RangeSlider.override({
  format: "0[.]00"
})
