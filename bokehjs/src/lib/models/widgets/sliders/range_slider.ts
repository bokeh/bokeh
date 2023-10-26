import * as numbro from "@bokeh/numbro"

import {NumericalRangeSlider, NumericalRangeSliderView} from "./numerical_range_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"

export class RangeSliderView extends NumericalRangeSliderView {
  declare model: RangeSlider

  override behaviour = "drag" as const
  override connected = [false, true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return numbro.format(value, format)
    } else {
      return format.compute(value)
    }
  }
}

export namespace RangeSlider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = NumericalRangeSlider.Props
}

export interface RangeSlider extends RangeSlider.Attrs {}

export class RangeSlider extends NumericalRangeSlider {
  declare properties: RangeSlider.Props
  declare __view_type__: RangeSliderView

  constructor(attrs?: Partial<RangeSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RangeSliderView

    this.override<RangeSlider.Props>({
      format: "0[.]00",
    })
  }
}
