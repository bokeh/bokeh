import * as numbro from "@bokeh/numbro"

import {AbstractSlider, AbstractRangeSliderView} from "./abstract_slider"
import {TickFormatter} from "../formatters/tick_formatter"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class RangeSliderView extends AbstractRangeSliderView {
  model: RangeSlider

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format))
      return numbro.format(value, format)
    else
      return this._formatter_view!.compute(value)
  }
}

export namespace RangeSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props
}

export interface RangeSlider extends RangeSlider.Attrs {}

export class RangeSlider extends AbstractSlider {
  properties: RangeSlider.Props
  __view_type__: RangeSliderView

  constructor(attrs?: Partial<RangeSlider.Attrs>) {
    super(attrs)
  }

  static init_RangeSlider(): void {
    this.prototype.default_view = RangeSliderView

    this.override<RangeSlider.Props>({
      format: "0[.]00",
    })
  }

  behaviour = "drag" as "drag"
  connected = [false, true, false]
}
