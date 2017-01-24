import {format} from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class RangeSliderView extends AbstractSliderView

  _calc_to: () ->
    return {
      start: @model.start
      end: @model.end
      value: @model.value
      step: @model.step
    }

  _calc_from: (values) -> values

export class RangeSlider extends AbstractSlider
  type: "RangeSlider"
  default_view: RangeSliderView

  behaviour: 'drag'
  connect: [false, true, false]

  _formatter: format

  @override {
    format: "0,0.00"
  }
