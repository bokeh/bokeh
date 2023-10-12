import type {Geometry} from "core/geometry"
import {logger} from "core/logging"
import type * as p from "core/properties"
import {SelectionManager} from "core/selection_manager"
import {Signal, Signal0} from "core/signaling"
import type {Arrayable, ArrayableNew, Data} from "core/types"
import type {PatchSet} from "core/patching"
import {uniq} from "core/util/array"
import {is_NDArray} from "core/util/ndarray"
import {isArray} from "core/util/types"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {SelectionPolicy, UnionRenderers} from "../selections/interaction_policy"
import {Selection} from "../selections/selection"
import {DataSource} from "./data_source"
import {assert} from "core/util/assert"

// Abstract base class for column based data sources, where the column
// based data may be supplied directly or be computed from an attribute

export namespace ColumnarDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataSource.Props & {
    data: p.Property<Map<string, Arrayable>> // XXX: this is hack!!!
    selection_policy: p.Property<SelectionPolicy>
    inspected: p.Property<Selection>
  }
}

export interface ColumnarDataSource extends ColumnarDataSource.Attrs {}

export abstract class ColumnarDataSource extends DataSource {
  declare properties: ColumnarDataSource.Props

  declare data: Map<string, Arrayable>

  _select: Signal0<this>
  inspect: Signal<[GlyphRenderer, {geometry: Geometry}], this>

  readonly selection_manager = new SelectionManager(this)

  constructor(attrs?: Partial<ColumnarDataSource.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ColumnarDataSource.Props>(({Ref}) => ({
      selection_policy: [ Ref(SelectionPolicy), () => new UnionRenderers() ],
    }))

    this.internal<ColumnarDataSource.Props>(({AnyRef}) => ({
      inspected:         [ AnyRef(), () => new Selection() ],
    }))
  }

  override initialize(): void {
    super.initialize()

    this._select = new Signal0(this, "select")
    this.inspect = new Signal(this, "inspect")
  }

  get_array<T>(key: string): T[] {
    let column = this.data.get(key)

    if (column == null) {
      this.data.set(key, column = [])
    } else if (!isArray(column)) {
      this.data.set(key, column = Array.from(column))
    }

    return column as T[]
  }

  get_column(name: string): Arrayable | null {
    return this.data.get(name) ?? null
  }

  get(name: string): Arrayable {
    const column = this.get_column(name)
    assert(column != null, `unknown column '${name}' in ${this}`)
    return column
  }

  columns(): string[] {
    // return the column names in this data source
    return [...this.data.keys()]
  }

  get_length(soft: boolean = true): number | null {
    const lengths = uniq([...this.data.values()].map((v) => is_NDArray(v) ? v.shape[0] : v.length))

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
    const empty: Map<string, Arrayable> = new Map()
    for (const col of this.columns()) {
      empty.set(col, new (this.data.get(col)!.constructor as ArrayableNew)(0))
    }
    this.data = empty
  }

  stream(new_data: Data, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    this.stream_to(this.properties.data, new_data, rollover, {sync})
  }

  patch(patches: PatchSet<unknown>, {sync}: {sync?: boolean} = {}): void {
    this.patch_to(this.properties.data, patches, {sync})
  }
}
