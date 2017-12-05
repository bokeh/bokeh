import {Model} from "../../model"
import {CustomJS} from "../callbacks/customjs"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export abstract class Range extends Model {

  start: number
  end: number
  min: number
  max: number
  callback?: ((obj: Range) => void) | CustomJS // XXX: Callback

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)
    this.connect(this.change, () => this._emit_callback())
  }

  reset(): void {
    /**
     * This method should be reimplemented by subclasses and ensure that
     * the callback, if exists, is executed at completion.
     */
    this.change.emit(undefined)
  }

  protected _emit_callback(): void {
    if (this.callback != null) {
      if (isFunction(this.callback))
        this.callback(this)
      else
        this.callback.execute(this, {})
    }
  }
}

Range.prototype.type = "Range"

Range.define({
  callback: [ p.Any ] // TODO: p.Either(p.Instance(Callback), p.Function)
})

Range.internal({
  plots: [ p.Array, [] ]
})
