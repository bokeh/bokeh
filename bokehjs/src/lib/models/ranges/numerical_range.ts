import {Range} from "./range"
import * as p from "core/properties"
import {clamp} from "core/util/math"

export namespace NumericalRange {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Range.Props & {
    start: p.Property<number>
    end: p.Property<number>
  }
}

export interface NumericalRange extends NumericalRange.Attrs {}

export abstract class NumericalRange extends Range {
  declare properties: NumericalRange.Props

  constructor(attrs?: Partial<NumericalRange.Attrs>) {
    super(attrs)
  }

  static {
    this.define<NumericalRange.Props>(({Float}) => ({
      start: [ Float, p.unset, {
        convert(value: number, obj: NumericalRange): number {
          const [lower, upper] = obj.computed_bounds
          return clamp(value, lower, upper)
        },
      }],
      end:   [ Float, p.unset, {
        convert(value: number, obj: NumericalRange): number {
          const [lower, upper] = obj.computed_bounds
          return clamp(value, lower, upper)
        },
      }],
    }))
  }
  /*
  override set start(v: number) {
    const [lower, upper] = this.computed_bounds
    v = clamp(v, lower, upper)
    this.properties.start.set_value(v)
  }

  override set end(v: number) {
    const [lower, upper] = this.computed_bounds
    v = clamp(v, lower, upper)
    this.properties.start.set_value(v)
  }
  */
}
