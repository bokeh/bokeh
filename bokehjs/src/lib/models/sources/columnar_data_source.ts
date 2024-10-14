import type {Geometry} from "core/geometry"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {SelectionManager} from "core/selection_manager"
import {Signal, Signal0} from "core/signaling"
import type {Arrayable, ArrayableNew, Data, Dict} from "core/types"
import type {PatchSet} from "core/patching"
import {assert} from "core/util/assert"
import {uniq} from "core/util/array"
import {is_NDArray} from "core/util/ndarray"
import {keys, values, entries, dict, clone} from "core/util/object"
import {isBoolean, isNumber, isString, isArray} from "core/util/types"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {SelectionPolicy, UnionRenderers} from "../selections/interaction_policy"
import {Selection} from "../selections/selection"
import {DataSource} from "./data_source"

// Abstract base class for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute

export namespace ColumnarDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataSource.Props & {
    data: p.Property<Data> // XXX: this is hack!!!
    default_values: p.Property<Dict<unknown>>
    selection_policy: p.Property<SelectionPolicy>
    inspected: p.Property<Selection>
  }
}

export interface ColumnarDataSource extends ColumnarDataSource.Attrs {}

export abstract class ColumnarDataSource extends DataSource {
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

  readonly _select: Signal0<this> = new Signal0(this, "select")
  readonly inspect: Signal<[GlyphRenderer, {geometry: Geometry}], this> = new Signal(this, "inspect")

  readonly selection_manager = new SelectionManager(this)

  constructor(attrs?: Partial<ColumnarDataSource.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ColumnarDataSource.Props>(({Ref, Dict, Unknown}) => ({
      default_values: [ Dict(Unknown), {} ],
      selection_policy: [ Ref(SelectionPolicy), () => new UnionRenderers() ],
    }))

    this.internal<ColumnarDataSource.Props>(({AnyRef}) => ({
      inspected:         [ AnyRef(), () => new Selection() ],
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

  get<T = unknown>(name: string): Arrayable<T> {
    const column = this.get_column(name)
    assert(column != null, `unknown column '${name}' in ${this}`)
    return column
  }

  set(name: string, column: Arrayable<unknown>): void {
    dict(this.data).set(name, column)
  }

  get_column(name: string): Arrayable | null {
    const data = dict(this.data)
    return data.get(name) ?? null
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

  get length(): number {
    return this.get_length() ?? 0
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
