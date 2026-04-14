import type {SliderSpec} from "./abstract_slider"
import {NumericalRangeSlider, NumericalRangeSliderView} from "./numerical_range_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import {datetime} from "core/util/templating"

export class DateRangeSliderView extends NumericalRangeSliderView {
  declare readonly model: DateRangeSlider
  declare readonly signals: p.SignalsOf<DateRangeSlider.Props>
  declare readonly values: DateRangeSlider.Attrs

  protected override _calc_spec(): SliderSpec<number> {
    const spec = super._calc_spec()
    const {step} = spec
    if (step != null) {
      return {...spec, step: step*86_400_000}
    } else {
      return spec
    }
  }

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return datetime(value, format)
    } else {
      return format.compute(value)
    }
  }
}

export namespace DateRangeSlider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = NumericalRangeSlider.Props
}

export interface DateRangeSlider extends DateRangeSlider.Attrs {}

export class DateRangeSlider extends NumericalRangeSlider {
  declare properties: DateRangeSlider.Props
  declare __view_type__: DateRangeSliderView

  constructor(attrs?: Partial<DateRangeSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DateRangeSliderView

    this.override<DateRangeSlider.Props>({
      format: "%d %b %Y",
    })
  }
}
