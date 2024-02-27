import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"

export abstract class BaseNumericalSliderView extends AbstractSliderView<number> {
  declare model: BaseNumericalSlider

  override connect_signals(): void {
    super.connect_signals()

    const {start, end, step} = this.model.properties
    this.on_change([start, end, step], () => this._update_slider())
  }

  protected abstract _formatter(value: number, format: string | TickFormatter): string

  pretty(value: number): string {
    return this._formatter(value, this.model.format)
  }
}

export namespace BaseNumericalSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props & {
    start: p.Property<number>
    end: p.Property<number>
    step: p.Property<number>
    format: p.Property<string | TickFormatter>
  }
}

export interface BaseNumericalSlider extends BaseNumericalSlider.Attrs {}

export abstract class BaseNumericalSlider extends AbstractSlider<number> {
  declare properties: BaseNumericalSlider.Props
  declare declare__view_type__: BaseNumericalSliderView

  constructor(attrs?: Partial<BaseNumericalSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseNumericalSlider.Props>(({Float, Str, Or, Ref}) => {
      return {
        start:  [ Float ],
        end:    [ Float ],
        step:   [ Float, 1 ],
        format: [ Or(Str, Ref(TickFormatter)) ],
      }
    })
  }
}
