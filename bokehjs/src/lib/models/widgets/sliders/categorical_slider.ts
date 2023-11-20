import type {SliderSpec} from "./abstract_slider"
import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import type * as p from "core/properties"
import {isNumber} from "core/util/types"

export class CategoricalSliderView extends AbstractSliderView<string> {
  declare model: CategoricalSlider

  override connect_signals(): void {
    super.connect_signals()

    const {categories} = this.model.properties
    this.on_change([categories], () => this._update_slider())
  }

  protected _calc_spec(): SliderSpec<string> {
    const {categories, value} = this.model
    return {
      min: 0,
      max: categories.length - 1,
      step: 1,
      values: [value],
      compute(value: string): number {
        return categories.indexOf(value)
      },
      invert(synthetic: number): string {
        return categories[synthetic]
      },
    }
  }

  protected _calc_to(value: string): string[] {
    return [value]
  }
  protected _calc_from([value]: string[]): string {
    return value
  }

  pretty(value: number | string): string {
    return isNumber(value) ? this.model.categories[value] : value
  }
}

export namespace CategoricalSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props & {
    categories: p.Property<string[]>
    value: p.Property<string>
    value_throttled: p.Property<string>
  }
}

export interface CategoricalSlider extends CategoricalSlider.Attrs {}

export class CategoricalSlider extends AbstractSlider<string> {
  declare properties: CategoricalSlider.Props
  declare __view_type__: CategoricalSliderView

  declare value: string
  declare value_throttled: string

  constructor(attrs?: Partial<CategoricalSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CategoricalSliderView

    this.define<CategoricalSlider.Props>(({List, Str}) => ({
      categories: [ List(Str) ],
    }))
  }
}
