/* XXX: partial */
import {format} from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class SliderView extends AbstractSliderView {
  model: Slider

  _calc_to() {
    return {
      start: this.model.start,
      end: this.model.end,
      value: [this.model.value],
      step: this.model.step,
    }
  }

  _calc_from([value]) {
    if (Number.isInteger(this.model.start) && Number.isInteger(this.model.end) && Number.isInteger(this.model.step))
      return Math.round(value)
    else
      return value
  }
}

export class Slider extends AbstractSlider {
  behaviour = 'tap'
  connected = [true, false]

  _formatter = format
}

Slider.prototype.type = "Slider"
Slider.prototype.default_view = SliderView

Slider.override({
  format: "0[.]00"
})
