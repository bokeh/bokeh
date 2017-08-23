import {format} from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import {isInteger} from "core/util/math"

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

  @getters {
    _default_format: () ->
      if isInteger(@start) and isInteger(@end) and isInteger(@step) then "0,0" else "0,0.00"
  }
