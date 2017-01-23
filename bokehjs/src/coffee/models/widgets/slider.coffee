import {AbstractSlider, AbstractSliderView} from "./abstract_slider"

export class SliderView extends AbstractSliderView

  _calc_to: () ->
    return {
      start: @model.start
      end: @model.end
      value: [@model.value]
      step: @model.step
    }

  _calc_from: (values) ->
    [value] = values
    return parseFloat(value)

export class Slider extends AbstractSlider
  type: "Slider"
  default_view: SliderView

  @override {
    behaviour: 'tap'
    connect: [true, false]
  }
