import * as numbro from "@bokeh/numbro"

import {NumericalSlider, NumericalSliderView} from "./numerical_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class SliderView extends NumericalSliderView {
  declare model: Slider

  override behaviour = "tap" as const
  override connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return numbro.format(value, format)
    } else {
      return format.compute(value)
    }
  }
}

export namespace Slider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = NumericalSlider.Props
}

export interface Slider extends Slider.Attrs {}

export class Slider extends NumericalSlider {
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
}
