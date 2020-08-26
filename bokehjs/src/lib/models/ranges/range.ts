import {Model} from "../../model"
import type {Plot} from "../plots/plot"
import * as p from "core/properties"

export namespace Range {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    bounds: p.Property<[number, number] | "auto" | null>
    min_interval: p.Property<number>
    max_interval: p.Property<number>
    plots: p.Property<Plot[]>
  }
}

export interface Range extends Range.Attrs {}

export abstract class Range extends Model {
  properties: Range.Props

  constructor(attrs?: Partial<Range.Attrs>) {
    super(attrs)
  }

  static init_Range(): void {
    this.define<Range.Props>(({Number, Tuple, Or, Auto, Nullable}) => ({
      bounds:       [ Nullable(Or(Tuple(Number, Number), Auto)) ],
      min_interval: [ Number ],
      max_interval: [ Number ],
    }))

    this.internal<Range.Props>(({Array, AnyRef}) => ({
      plots: [ Array(AnyRef<Plot>()), [] ], // XXX: recursive imports
    }))
  }

  start: number
  end: number

  abstract get min(): number
  abstract get max(): number

  have_updated_interactively: boolean = false

  abstract reset(): void

  get is_reversed(): boolean {
    return this.start > this.end
  }

  get is_valid(): boolean {
    return !isNaN(this.min) && !isNaN(this.max)
  }
}
