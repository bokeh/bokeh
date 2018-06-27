import {Model} from "../../model"
import {Plot} from "../plots/plot"
import {CustomJS} from "../callbacks/customjs"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export namespace Range {
  export interface Attrs extends Model.Attrs {
    bounds: [number, number] | "auto" | null
    min_interval: number
    max_interval: number
    callback?: ((obj: Range) => void) | CustomJS // XXX: Callback
    plots: Plot[]
  }

  export interface Props extends Model.Props {
    bounds: p.Property<[number, number] | "auto" | null>
  }
}

export interface Range extends Range.Attrs {}

export abstract class Range extends Model {

  properties: Range.Props

  constructor(attrs?: Partial<Range.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Range"

    this.define({
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

  reset(): void {
    /**
     * This method should be reimplemented by subclasses and ensure that
     * the callback, if exists, is executed at completion.
     */
    this.change.emit()
  }

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

Range.initClass()
