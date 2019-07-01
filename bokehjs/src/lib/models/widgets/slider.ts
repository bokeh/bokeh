import * as numbro from "numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import * as p from "core/properties"

export class SliderView extends AbstractSliderView {
  model: Slider
}

export namespace Slider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface Slider extends Slider.Attrs {}

export class Slider extends AbstractSlider {
  properties: Slider.Props

  constructor(attrs?: Partial<Slider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
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
