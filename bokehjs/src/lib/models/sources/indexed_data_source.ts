import type {Geometry} from "core/geometry"
import {IndexedSelectionManager} from "core/selection_manager"
import {Signal, Signal0} from "core/signaling"
import type {Arrayable} from "core/types"
import {assert} from "core/util/assert"
import type {Index} from "core/util/templating"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {SelectionPolicy} from "../selections/interaction_policy"
import {Selection} from "../selections/selection"
import type * as p from "core/properties"
import {DataSource} from "./data_source"

export namespace IndexedDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataSource.Props & {
    selected: p.Property<Selection>
    selection_policy: p.Property<SelectionPolicy>
    inspected: p.Property<Selection>
  }
}

export interface IndexedDataSource extends IndexedDataSource.Attrs {}

/** A data source exposing one selectable, field-addressable record axis. */
export abstract class IndexedDataSource extends DataSource {
  declare properties: IndexedDataSource.Props

  readonly _select: Signal0<this> = new Signal0(this, "select")
  readonly inspect: Signal<[GlyphRenderer, {geometry: Geometry}], this> = new Signal(this, "inspect")

  readonly selection_manager = new IndexedSelectionManager(this)

  static {
    this.define<IndexedDataSource.Props>(({Ref}) => ({
      selected: [ Ref(Selection), () => Selection.create(), {readonly: true} ],
      selection_policy: [ Ref(SelectionPolicy), () => SelectionPolicy.create() ],
    }))

    this.internal<IndexedDataSource.Props>(({AnyRef}) => ({
      inspected: [ AnyRef(), () => Selection.create() ],
    }))
  }

  /** The number of logical records, or null when it isn't known. */
  abstract get_length(): number | null

  /**
   * A logical field indexed by record. Field items may themselves be nested,
   * ragged, or shaped values; implementations need not store fields as columns.
   */
  abstract get_field(name: string): Arrayable | null

  /** A record assembled from all fields at the requested logical index. */
  abstract get_record(index: Index): {[key: string]: unknown}

  /** The logical field names exposed by this source. */
  abstract fields(): string[]

  get<T = unknown>(name: string): Arrayable<T> {
    const field = this.get_field(name)
    assert(field != null, `unknown field '${name}' in ${this}`)
    return field
  }

  get length(): number {
    return this.get_length() ?? 0
  }
}
