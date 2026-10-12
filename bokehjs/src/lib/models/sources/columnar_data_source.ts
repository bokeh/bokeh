import type {HasProps} from "core/has_props"
import {logger} from "core/logging"
import type * as p from "core/properties"
import type {Arrayable, ArrayableNew, Attrs, Data, Dict} from "core/types"
import type {PatchSet} from "core/patching"
import {uniq} from "core/util/array"
import {is_NDArray} from "core/util/ndarray"
import {keys, values, entries, dict, clone} from "core/util/object"
import {isBoolean, isNumber, isString, isArray} from "core/util/types"
import {IndexedDataSource} from "./indexed_data_source"
import type {Index} from "core/util/templating"

// Abstract base class for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute

export namespace ColumnarDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = IndexedDataSource.Props & {
    data: p.Property<Data> // XXX: this is hack!!!
    default_values: p.Property<Dict<unknown>>
  }
}

export interface ColumnarDataSource extends ColumnarDataSource.Attrs {}

export abstract class ColumnarDataSource extends IndexedDataSource {
  declare properties: ColumnarDataSource.Props

  declare data: Data

  override setv<T extends Attrs>(changed_attrs: Partial<T>, options: HasProps.SetOptions = {}): void {
    if ("data" in changed_attrs) {
      this._with_selection_sync(options.sync, () => super.setv(changed_attrs, options))
    } else {
      super.setv(changed_attrs, options)
    }
  }

  get_array<T>(key: string): T[] {
    const data = dict(this.data)
    let column = data.get(key)

    if (column == null) {
      data.set(key, column = [])
    } else if (!isArray(column)) {
      data.set(key, column = Array.from(column))
    }

    return column as T[]
  }

  static {
    this.define<ColumnarDataSource.Props>(({Dict, Unknown}) => ({
      default_values: [ Dict(Unknown), {} ],
    }))
  }

  get inferred_defaults(): Map<string, unknown> {
    const defaults: Map<string, unknown> = new Map()
    for (const [name, array] of entries(this.data)) {
      const value = (() => {
        if (is_NDArray(array)) {
          switch (array.dtype) {
            case "bool":
              return false
            case "uint8":
            case "int8":
            case "uint16":
            case "int16":
            case "uint32":
            case "int32":
            case "float32":
            case "float64":
              return 0
            case "object":
              return null
          }
        } else if (isArray(array) && array.length != 0) {
          const [item] = array
          if (item === null) {
            return null
          } else if (isBoolean(item)) {
            return false
          } else if (isNumber(item)) {
            return 0
          } else if (isString(item)) {
            return ""
          } else if (isArray(item)) {
            return []
          }
        }
        return undefined
      })()
      if (value !== undefined) {
        defaults.set(name, value)
      }
    }
    return defaults
  }

  set(name: string, column: Arrayable<unknown>): void {
    dict(this.data).set(name, column)
  }

  override connect_signals(): void {
    super.connect_signals()

    const prune_selection = () => this._prune_selection()
    this.connect(this.properties.data.change, prune_selection)
    this.connect(this.streaming, prune_selection)
    this.connect(this.patching, prune_selection)
  }

  get_field(name: string): Arrayable | null {
    const data = dict(this.data)
    return data.get(name) ?? null
  }

  /** @deprecated use get_field() */
  get_column(name: string): Arrayable | null {
    return this.get_field(name)
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    const result: {[key: string]: unknown} = {}
    for (const [field, array] of entries(this.data)) {
      result[field] = array[i]
    }
    return result
  }

  /** @deprecated use get_record() */
  get_row(index: Index): {[key: string]: unknown} {
    return this.get_record(index)
  }

  fields(): string[] {
    return keys(this.data)
  }

  /** @deprecated use fields() */
  columns(): string[] {
    return this.fields()
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
        } else {
          throw new Error(msg)
        }
      }
    }
  }

  clear(): void {
    const data = clone(this.data)
    const proxy = dict(data)
    for (const [name, column] of proxy) {
      const empty = new (column.constructor as ArrayableNew)(0)
      proxy.set(name, empty)
    }
    this.data = data
  }

  stream(new_data: Data, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    this.stream_to(this.properties.data, new_data, rollover, {sync})
  }

  patch(patches: PatchSet<unknown>, {sync}: {sync?: boolean} = {}): void {
    this.patch_to(this.properties.data, patches, {sync})
  }

  override stream_to(prop: p.Property<Data>, new_data: Data, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    this._with_selection_sync(sync, () => {
      super.stream_to(prop, new_data, rollover, {sync})
      this.data_changed.emit({fields: keys(new_data), structural: true})
    })
  }

  override patch_to(prop: p.Property<Data>, patches: PatchSet<unknown>, {sync}: {sync?: boolean} = {}): number[] {
    return this._with_selection_sync(sync, () => {
      const indices = super.patch_to(prop, patches, {sync})
      this.data_changed.emit({fields: keys(patches), indices, structural: false})
      return indices
    })
  }
}
