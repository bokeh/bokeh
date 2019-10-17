import {Model} from "../../model"
import {Plot} from "../plots/plot"
import {CustomJS} from "../callbacks/customjs"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export namespace Range {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    bounds: p.Property<[number, number] | "auto" | null>
    min_interval: p.Property<number>
    max_interval: p.Property<number>
    callback: p.Property<((obj: Range) => void) | CustomJS> // XXX: Callback
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
      callback:     [ p.Any ], // TODO: p.Either(p.Instance(Callback), p.Function)
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

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => this._emit_callback())
  }

  abstract reset(): void

  protected _emit_callback(): void {
    if (this.callback != null) {
      if (isFunction(this.callback))
        this.callback(this)
      else
        this.callback.execute(this, {})
    }
  }

  get is_reversed(): boolean {
    return this.start > this.end
  }
}
