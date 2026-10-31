import {logger} from "core/logging"
import type * as p from "core/properties"
import type {Arrayable, ArrayableNew, Data, Dict, PlainObject} from "core/types"
import type {PatchSet} from "core/patching"
import {uniq} from "core/util/array"
import {is_NDArray, get_array_item} from "core/util/ndarray"
import {keys, values, entries, dict, clone} from "core/util/object"
import {isBoolean, isNumber, isString, isArray} from "core/util/types"
import {IndexedDataSource} from "./indexed_data_source"
import type {Index} from "core/util/templating"

// Filters often use only a few columns, so unpack shaped values on demand.
function define_lazy_row_value(row: PlainObject, column: string, array: Arrayable, index: number): void {
  const set_value = (value: unknown) => {
    Object.defineProperty(row, column, {value, enumerable: true, configurable: true, writable: true})
  }
  Object.defineProperty(row, column, {
    enumerable: true,
    configurable: true,
    get: () => {
      const value = get_array_item(array, index)
      set_value(value)
      return value
    },
    set: set_value,
  })
}

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
    const data_changed = () => this.data_changed.emit({structural: true})
    this.connect(this.properties.data.change, data_changed)
    this.connect(this.streaming, data_changed)
    this.connect(this.patching, (indices) => this.data_changed.emit({indices, structural: false}))
  }

  override stream_to(prop: p.Property<Data>, new_data: Data, rollover?: number, options: {sync?: boolean} = {}): void {
    this._with_selection_sync(options.sync, () => super.stream_to(prop, new_data, rollover, options))
  }

  override patch_to(prop: p.Property<Data>, patches: PatchSet<unknown>, options: {sync?: boolean} = {}): void {
    this._with_selection_sync(options.sync, () => super.patch_to(prop, patches, options))
  }

  get_field(name: string): Arrayable | null {
    return this.get_column(name)
  }

  get_record(index: Index): PlainObject {
    return this.get_row(index)
  }

  fields(): string[] {
    return this.columns()
  }

  get_column(name: string): Arrayable | null {
    const data = dict(this.data)
    return data.get(name) ?? null
  }

  get_row(index: Index): PlainObject {
    const i = isNumber(index) ? index : index.index
    const result: PlainObject = {}
    for (const [column, array] of entries(this.data)) {
      if (is_NDArray(array) && array.dimension > 1) {
        define_lazy_row_value(result, column, array, i)
      } else {
        result[column] = array[i]
      }
    }
    return result
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
}
