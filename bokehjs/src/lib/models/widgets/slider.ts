import * as numbro from "@bokeh/numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import * as p from "core/properties"
import {isString} from "core/util/types"
import {TickFormatter} from "../formatters/tick_formatter"

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

    this.override({
      format: "0[.]00",
    })
  }

  behaviour = "tap" as "tap"
  connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)){
      return numbro.format(value, format)
    } else {
      return format.doFormat([value], {loc: 0})[0]
    }
  }
}
