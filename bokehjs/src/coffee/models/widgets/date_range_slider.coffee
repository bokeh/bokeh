import * as tz from "timezone"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class DateRangeSliderView extends AbstractSliderView

  _calc_to: () ->
    return {
      start: @model.start
      end: @model.end
      value: @model.value
      step: @model.step
    }

  _calc_from: (values) -> values

export class DateRangeSlider extends AbstractSlider
  type: "DateRangeSlider"
  default_view: DateRangeSliderView

  behaviour: 'drag'
  connect: [false, true, false]

  _formatter: tz

  @override {
    format: "%d %b %G"
  }
