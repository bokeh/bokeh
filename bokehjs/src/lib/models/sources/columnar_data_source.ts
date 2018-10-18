import {DataSource} from "./data_source"
import {Signal, Signal0} from "core/signaling"
import {logger} from "core/logging"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {isArray} from "core/util/types"
import {uniq, range} from "core/util/array"
import {keys, values} from "core/util/object"
import {Shape} from "core/util/serialization"
import {Selection} from "../selections/selection"
import {SelectionPolicy, UnionRenderers} from "../selections/interaction_policy"

// Abstract baseclass for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute

export namespace ColumnarDataSource {
  export interface Attrs extends DataSource.Attrs {
    selection_policy: SelectionPolicy
    selection_manager: SelectionManager
    inspected: Selection
    _shapes: {[key: string]: Shape | Shape[] | Shape[][] | Shape[][][]}
  }

  export interface Props extends DataSource.Props {
    data: p.Property<{[key: string]: Arrayable}> // XXX: this is hack!!!
  }
}

export interface ColumnarDataSource extends ColumnarDataSource.Attrs {}

export abstract class ColumnarDataSource extends DataSource {

  properties: ColumnarDataSource.Props

  data: {[key: string]: Arrayable}

  get_array<T>(key: string): T[] {
    let column = this.data[key]

    if (column == null)
      this.data[key] = column = []
    else if (!isArray(column))
      this.data[key] = column = Array.from(column)

    return column as T[]
  }

  _select: Signal0<this>
  inspect: Signal<any, this> // XXX: <[indices, tool, renderer-view, source, data], this>

  streaming: Signal0<this>
  patching: Signal<number[], this>

  constructor(attrs?: Partial<ColumnarDataSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ColumnarDataSource'

    this.define({
      selection_policy: [ p.Instance, () => new UnionRenderers() ],
    })

    this.internal({
      selection_manager: [ p.Instance, (self: ColumnarDataSource) => new SelectionManager({source: self}) ],
      inspected:         [ p.Instance, () => new Selection() ],
      _shapes:           [ p.Any, {}],
    })
  }

  initialize(): void {
    super.initialize()

    this._select = new Signal0(this, "select")
    this.inspect = new Signal(this, "inspect") // XXX: <[indices, tool, renderer-view, source, data], this>

    this.streaming = new Signal0(this, "streaming")
    this.patching = new Signal(this, "patching")
  }

  get_column(colname: string): Arrayable | null {
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
        } else
          throw new Error(msg)
      }
    }
  }

  get_indices(): number[] {
    const length = this.get_length()
    return range(0, length != null ? length : 1)
    //TODO: returns [0] when no data, should it?
  }

  clear(): void {
    const empty: {[key: string]: Arrayable} = {}
    for (const col of this.columns()) {
      empty[col] = new (<any>this.data[col].constructor)
    }
    this.data = empty
  }
}
ColumnarDataSource.initClass()
