import {format} from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class SliderView extends AbstractSliderView

  _calc_to: () ->
    return {
      start: @model.start
      end: @model.end
      value: [@model.value]
      step: @model.step
    }

  _calc_from: ([value]) -> value

export class Slider extends AbstractSlider
  type: "Slider"
  default_view: SliderView

  behaviour: 'tap'
  connected: [true, false]

  _formatter: format

  @override {
    format: "0,0.00"
  }
