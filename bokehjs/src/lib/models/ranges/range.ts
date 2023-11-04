import {Model} from "../../model"
import type {PlotView} from "../plots/plot"
import type * as p from "core/properties"
import {Nullable, Or, Tuple, Number, Auto} from "../../core/kinds"

const Bounds = Nullable(Or(Tuple(Nullable(Number), Nullable(Number)), Auto))
type Bounds = typeof Bounds["__type__"]

export namespace Range {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    bounds: p.Property<Bounds>
    min_interval: p.Property<number | null>
    max_interval: p.Property<number | null>
  }
}

export interface Range extends Range.Attrs {}

export abstract class Range extends Model {
  declare properties: Range.Props

  constructor(attrs?: Partial<Range.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Range.Props>(({Number, Nullable}) => ({
      bounds:       [ Bounds, null, {
        on_update(bounds: Bounds, obj: Range) {
          const [lower, upper] = bounds == "auto" || bounds == null ? [null, null] : bounds
          obj._computed_bounds = [lower ?? -Infinity, upper ?? Infinity]
        },
      }],
      min_interval: [ Nullable(Number), null ],
      max_interval: [ Nullable(Number), null ],
    }))
  }

  protected _computed_bounds: [number, number]
  get computed_bounds(): [number, number] {
    return this._computed_bounds
  }

  abstract start: number
  abstract end: number

  abstract get min(): number
  abstract get max(): number

  have_updated_interactively: boolean = false

  abstract reset(): void

  get is_reversed(): boolean {
    return this.start > this.end
  }

  get is_valid(): boolean {
    return isFinite(this.min) && isFinite(this.max)
  }

  get span(): number {
    return Math.abs(this.end - this.start)
  }

  /** internal */
  readonly plots = new Set<PlotView>()
}
