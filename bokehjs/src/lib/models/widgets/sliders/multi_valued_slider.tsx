import * as numbro from "@bokeh/numbro"

import type {SliderSpec, SliderKind} from "./abstract_slider"
import {multi_kind} from "./abstract_slider"
import {BaseNumericalSlider, BaseNumericalSliderView} from "./base_numerical_slider"
import type {TickFormatter} from "../../formatters/tick_formatter"
import type * as p from "core/properties"
import {isString} from "core/util/types"
import {clamp} from "core/util/math"

// TODO make this configurable; unordered handles are supported with `multi_kind({ordered: false})`
const ordered_kind = multi_kind({ordered: true})

export class MultiValuedSliderView extends BaseNumericalSliderView {
  declare readonly model: MultiValuedSlider
  declare readonly signals: p.SignalsOf<MultiValuedSlider.Props>
  declare readonly values: MultiValuedSlider.Attrs

  protected get kind(): SliderKind {
    return ordered_kind
  }

  protected _calc_spec(): SliderSpec<number> {
    const {start, end, step} = this.values
    return {
      start,
      end,
      step,
      compute: (value: number) => value,
      invert: (synthetic: number) => synthetic,
    }
  }

  protected _calc_values(): number[] {
    return this.values.value
  }

  protected _calc_from(values: number[]): number[] {
    return values
  }

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)) {
      return numbro.format(value, format)
    } else {
      return format.compute(value)
    }
  }
}

export namespace MultiValuedSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseNumericalSlider.Props & {
    value: p.Property<number[]>
    value_throttled: p.Property<number[]>
  }
}

export interface MultiValuedSlider extends MultiValuedSlider.Attrs {}

export class MultiValuedSlider extends BaseNumericalSlider {
  declare properties: MultiValuedSlider.Props
  declare __view_type__: MultiValuedSliderView

  declare value: number[]
  declare value_throttled: number[]

  protected _enforce_bounds(): void {
    const changes: {value?: number[], value_throttled?: number[]} = {}
    const [lo, hi] = this._bounds()

    const changed = (values: number[], clamped: number[]) => clamped.some((v, i) => v != values[i])

    if (!this.properties.value.is_unset) {
      const clamped = this.value.map((v) => clamp(v, lo, hi))
      if (changed(this.value, clamped)) {
        changes.value = clamped
      }
    }

    if (!this.properties.value_throttled.is_unset) {
      const clamped = this.value_throttled.map((v) => clamp(v, lo, hi))
      if (changed(this.value_throttled, clamped)) {
        changes.value_throttled = clamped
      }
    } else if (changes.value != null) {
      // copy, so that `value` and `value_throttled` never share one array
      changes.value_throttled = [...changes.value]
    }

    if (changes.value != null || changes.value_throttled != null) {
      this.setv(changes)
    }
  }

  static {
    this.prototype.default_view = MultiValuedSliderView

    this.override<MultiValuedSlider.Props>({
      format: "0[.]00",
    })
  }
}
