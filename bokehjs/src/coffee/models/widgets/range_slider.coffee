import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class RangeSliderView extends AbstractSliderView

  _calc_to: () ->
    return {
      start: @model.start
      end: @model.end
      value: @model.value
      step: @model.step
    }

  _calc_from: (values) ->
    [min, max] = values
    return [parseFloat(min), parseFloat(max)]

export class RangeSlider extends AbstractSlider
  type: "RangeSlider"
  default_view: RangeSliderView

  @override {
    behaviour: 'drag'
    connect: [false, true, false]
  }
