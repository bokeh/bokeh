import * as numbro from "@bokeh/numbro"

import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import type {TickFormatter} from "../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class SliderView extends AbstractSliderView {
  declare model: Slider
}

export namespace Slider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface Slider extends Slider.Attrs {}

export class Slider extends AbstractSlider {
  declare properties: Slider.Props
  declare __view_type__: SliderView

  constructor(attrs?: Partial<Slider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SliderView

    this.override<Slider.Props>({
      format: "0[.]00",
    })
  }

  override behaviour = "tap" as "tap"
  override connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return numbro.format(value, format)
    } else {
      return format.compute(value)
    }
  }
}
