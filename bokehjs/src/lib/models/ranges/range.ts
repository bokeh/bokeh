import {Model} from "../../model"
import type {CartesianFrameView} from "../canvas/cartesian_frame"
import type * as p from "core/properties"
import {OurSet} from "core/util/std"

export namespace Range {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    bounds: p.Property<[number | null, number | null] | "auto" | null>
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
    this.define<Range.Props>(({Number, Tuple, Or, Auto, Nullable}) => ({
      bounds:       [ Nullable(Or(Tuple(Nullable(Number), Nullable(Number)), Auto)), null ],
      min_interval: [ Nullable(Number), null ],
      max_interval: [ Nullable(Number), null ],
    }))
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
  readonly frames = new OurSet<CartesianFrameView>()
}
