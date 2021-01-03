import {DataSource} from "./data_source"
import {Signal, Signal0} from "core/signaling"
import {logger} from "core/logging"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"
import {Arrayable, ArrayableNew} from "core/types"
import {isArray} from "core/util/types"
import {uniq} from "core/util/array"
import {keys, values} from "core/util/object"
import {Selection} from "../selections/selection"
import {SelectionPolicy, UnionRenderers} from "../selections/interaction_policy"
import type {Renderer} from "../renderers/renderer"
import {Geometry} from "core/geometry"
import {is_NDArray} from "core/util/ndarray"

// Abstract baseclass for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute

export namespace ColumnarDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataSource.Props & {
    data: p.Property<{[key: string]: Arrayable}> // XXX: this is hack!!!
    selection_policy: p.Property<SelectionPolicy>
    selection_manager: p.Property<SelectionManager>
    inspected: p.Property<Selection>
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
  inspect: Signal<[Renderer, {geometry: Geometry}], this>

  streaming: Signal0<this>
  patching: Signal<number[], this>

  constructor(attrs?: Partial<ColumnarDataSource.Attrs>) {
    super(attrs)
  }

  static init_ColumnarDataSource(): void {
    this.define<ColumnarDataSource.Props>(({Ref}) => ({
      selection_policy: [ Ref(SelectionPolicy), () => new UnionRenderers() ],
    }))

    this.internal<ColumnarDataSource.Props>(({AnyRef}) => ({
      selection_manager: [ AnyRef(), (self) => new SelectionManager({source: self as ColumnarDataSource}) ],
      inspected:         [ AnyRef(), () => new Selection() ],
    }))
  }

  initialize(): void {
    super.initialize()

    this._select = new Signal0(this, "select")
    this.inspect = new Signal(this, "inspect")

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
    const lengths = uniq(values(this.data).map((v) => is_NDArray(v) ? v.shape[0] : v.length))

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

  get length(): number {
    return this.get_length() ?? 0
  }

  clear(): void {
    const empty: {[key: string]: Arrayable} = {}
    for (const col of this.columns()) {
      empty[col] = new (this.data[col].constructor as ArrayableNew)(0)
    }
    this.data = empty
  }
}
