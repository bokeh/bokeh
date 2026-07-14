import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"

export abstract class BaseNumericalSliderView extends AbstractSliderView<number> {
  declare readonly model: BaseNumericalSlider
  declare readonly signals: p.SignalsOf<BaseNumericalSlider.Props>
  declare readonly values: BaseNumericalSlider.Attrs

  protected abstract _formatter(value: number, format: string | TickFormatter): string

  pretty(value: number): string {
    return this._formatter(value, this.values.format)
  }
}

export namespace BaseNumericalSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props & {
    start: p.Property<number>
    end: p.Property<number>
    step: p.Property<number | null>
    format: p.Property<string | TickFormatter>
  }
}

export interface BaseNumericalSlider extends BaseNumericalSlider.Attrs {}

export abstract class BaseNumericalSlider extends AbstractSlider<number> {
  declare properties: BaseNumericalSlider.Props
  declare __view_type__: BaseNumericalSliderView

  constructor(attrs?: Partial<BaseNumericalSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseNumericalSlider.Props>(({Float, Str, Or, Ref, Nullable}) => {
      return {
        start:  [ Float ],
        end:    [ Float ],
        step:   [ Nullable(Float), 1 ],
        format: [ Or(Str, Ref(TickFormatter)) ],
      }
    })
  }
}
