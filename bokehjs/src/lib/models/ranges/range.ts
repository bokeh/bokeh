import {Model} from "../../model"
import {Plot} from "../plots/plot"
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
    this.define<Range.Props>({
      bounds:       [ p.Any ], // TODO (bev)
      min_interval: [ p.Any ],
      max_interval: [ p.Any ],
    })

    this.internal({
      plots: [ p.Array, [] ],
    })
  }

  start: number
  end: number
  min: number
  max: number

  have_updated_interactively: boolean = false

  abstract reset(): void

  get is_reversed(): boolean {
    return this.start > this.end
  }

  get is_valid(): boolean {
    return !isNaN(this.min) && !isNaN(this.max)
  }
}
