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

  _calc_from: ([value]) ->
    if Number.isInteger(@model.start) and Number.isInteger(@model.end) and Number.isInteger(@model.step)
      return Math.round(value)
    else
      value

export class Slider extends AbstractSlider
  type: "Slider"
  default_view: SliderView

  behaviour: 'tap'
  connected: [true, false]

  _formatter: format

  @override {
    format: "0[.]00"
  }
