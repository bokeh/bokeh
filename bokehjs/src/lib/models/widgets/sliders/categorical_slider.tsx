import type {SliderSpec, SliderKind} from "./abstract_slider"
import {AbstractSlider, AbstractSliderView, single_kind} from "./abstract_slider"
import type * as p from "core/properties"

export class CategoricalSliderView extends AbstractSliderView<string> {
  declare readonly model: CategoricalSlider
  declare readonly signals: p.SignalsOf<CategoricalSlider.Props>
  declare readonly values: CategoricalSlider.Attrs

  protected get kind(): SliderKind {
    return single_kind
  }

  protected _calc_spec(): SliderSpec<string> {
    const {categories} = this.values
    return {
      start: 0,
      end: categories.length - 1,
      step: 1,
      compute(value: string): number {
        return categories.indexOf(value)
      },
      invert(synthetic: number): string {
        return categories[synthetic]
      },
    }
  }

  protected _calc_values(): string[] {
    return [this.values.value]
  }

  protected _calc_from([value]: string[]): string {
    return value
  }

  pretty(value: string): string {
    return value
  }
}

export namespace CategoricalSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props & {
    categories: p.Property<string[]>
    value: p.Property<string>
  }
}

export interface CategoricalSlider extends CategoricalSlider.Attrs {}

export class CategoricalSlider extends AbstractSlider<string> {
  declare properties: CategoricalSlider.Props
  declare __view_type__: CategoricalSliderView

  declare value: string

  static {
    this.prototype.default_view = CategoricalSliderView

    this.define<CategoricalSlider.Props>(({List, Str}) => ({
      categories: [ List(Str) ],
    }))
  }
}
