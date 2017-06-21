import * as tz from "timezone"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class DateSliderView extends AbstractSliderView

  _calc_to: () ->
    return {
      start: @model.start
      end: @model.end
      value: [@model.value]
      step: @model.step
    }

  _calc_from: ([value]) -> value

export class DateSlider extends AbstractSlider
  type: "DateSlider"
  default_view: DateSliderView

  behaviour: 'tap'
  connected: [true, false]

  _formatter: tz

  @override {
    format: "%d %b %G"
  }
