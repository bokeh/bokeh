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

export namespace RangeSlider {
  export interface Attrs extends AbstractSlider.Attrs {}
}

export interface RangeSlider extends AbstractSlider, RangeSlider.Attrs {}

export class RangeSlider extends AbstractSlider {

  static initClass() {
    this.prototype.type = "RangeSlider"
    this.prototype.default_view = RangeSliderView

    this.override({
      format: "0[.]00",
    })
  }

  behaviour = "drag" as "drag"
  connected = [false, true, false]

  _formatter = format
}

RangeSlider.initClass()
