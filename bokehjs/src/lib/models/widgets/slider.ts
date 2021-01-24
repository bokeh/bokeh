import * as numbro from "@bokeh/numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import {TickFormatter} from "../formatters/tick_formatter"
import * as p from "core/properties"
import {isString} from "core/util/types"

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
  __view_type__: SliderView

  constructor(attrs?: Partial<Slider.Attrs>) {
    super(attrs)
  }

  static init_Slider(): void {
    this.prototype.default_view = SliderView

    this.override<Slider.Props>({
      format: "0[.]00",
      value_throttled: 0,
    })
  }

  behaviour = "tap" as "tap"
  connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format))
      return numbro.format(value, format)
    else
      return format.compute(value)
  }
}
