import * as numbro from "numbro"

import {AbstractSlider, AbstractSliderView, SliderSpec} from "./abstract_slider"

export class SliderView extends AbstractSliderView {
  model: Slider

  protected _calc_to(): SliderSpec {
    return {
      start: this.model.start,
      end: this.model.end,
      value: [this.model.value],
      step: this.model.step,
    }
  }

  protected _calc_from([value]: number[]): number {
    if (Number.isInteger(this.model.start) && Number.isInteger(this.model.end) && Number.isInteger(this.model.step))
      return Math.round(value)
    else
      return value
  }
}

export namespace Slider {
  export interface Attrs extends AbstractSlider.Attrs {}

  export interface Props extends AbstractSlider.Props {}
}

export interface Slider extends Slider.Attrs {}

export class Slider extends AbstractSlider {

  properties: Slider.Props

  constructor(attrs?: Partial<Slider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Slider"
    this.prototype.default_view = SliderView

    this.override({
      format: "0[.]00",
    })
  }

  behaviour = "tap" as "tap"
  connected = [true, false]

  protected _formatter(value: number, format: string): string {
    return numbro.format(value, format)
  }
}

Slider.initClass()
