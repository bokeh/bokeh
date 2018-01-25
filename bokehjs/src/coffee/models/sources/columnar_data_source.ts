/* XXX: partial */
import {DataSource} from "./data_source"
import {Signal} from "core/signaling"
import {logger} from "core/logging"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"
import {uniq, range} from "core/util/array"
import {keys, values} from "core/util/object"
import {Selection} from "../selections/selection"
import {SelectionPolicy, UnionRenderers} from "../selections/interaction_policy"

// Abstract baseclass for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute
export class ColumnarDataSource extends DataSource {

  data: {[key: string]: any}
  _shapes: {[key: string]: any}

  _select: Signal<any, this>
  inspect: Signal<any, this> // XXX: <[indices, tool, renderer-view, source, data], this>

  streaming: Signal<any, this>
  patching: Signal<any, this> // <number[], ColumnarDataSource>

  inspected: Selection
  selection_policy: SelectionPolicy
  selection_manager: SelectionManager

  static initClass() {
    this.prototype.type = 'ColumnarDataSource'

    this.define({
      column_names:     [ p.Array, [] ],
      selection_policy: [ p.Instance  ],
    })

    this.internal({
      selection_manager: [ p.Instance, (self: ColumnarDataSource) => new SelectionManager({source: self}) ],
      inspected:         [ p.Instance, () => new Selection() ],
      _shapes:           [ p.Any, {}],
    })
  }

  initialize(): void {
    super.initialize()

    this._select = new Signal(this, "select")
    this.inspect = new Signal(this, "inspect") // XXX: <[indices, tool, renderer-view, source, data], this>

    this.streaming = new Signal(this, "streaming")
    this.patching = new Signal(this, "patching") // <number[], ColumnarDataSource>

    if (!this.selection_policy)
      this.selection_policy = new UnionRenderers() // added here instead of as default because can't set default
                                                   // on Python side without error
  }

  get_column(colname: string): any[] | null {
    const column = this.data[colname]
    return column != null ? column : null
  }

  columns(): string[] {
    // return the column names in this data source
    return keys(this.data)
  }

  get_length(soft: boolean = true): number | null {
    const lengths = uniq(values(this.data).map((v) => v.length))

    switch (lengths.length) {
      case 0: {
        return null // XXX: don't guess, treat on case-by-case basis
      }
      case 1: {
        return lengths[0]
      }
      default: {
        const msg = "data source has columns of inconsistent lengths"
        if (soft) {
          logger.warn(msg)
          return lengths.sort()[0]
        } else {
          throw new Error(msg)
        }
      }
    }
  }

  get_indices(): number[] {
    const length = this.get_length()
    return range(0, length != null ? length : 1)
    //TODO: returns [0] when no data, should it?
  }
}
ColumnarDataSource.initClass()
