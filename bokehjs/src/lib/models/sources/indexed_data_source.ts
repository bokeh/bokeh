import type {Geometry} from "core/geometry"
import {SelectionManager} from "core/selection_manager"
import {Signal, Signal0} from "core/signaling"
import type {HasProps} from "core/has_props"
import type {Arrayable, Attrs} from "core/types"
import {inplace_filter} from "core/util/array"
import {assert} from "core/util/assert"
import {entries} from "core/util/object"
import type {Index} from "core/util/templating"
import type {GlyphRenderer} from "../renderers/glyph_renderer"
import {SelectionPolicy, UnionRenderers} from "../selections/interaction_policy"
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

  readonly selection_manager = new SelectionManager(this)

  private _selection_sync: boolean = true

  protected _with_selection_sync<T>(sync: boolean | undefined, fn: () => T): T {
    const previous = this._selection_sync
    this._selection_sync = sync ?? true
    try {
      return fn()
    } finally {
      this._selection_sync = previous
    }
  }

  static {
    this.define<IndexedDataSource.Props>(({Ref}) => ({
      selected: [ Ref(Selection), () => Selection.create(), {readonly: true} ],
      selection_policy: [ Ref(SelectionPolicy), () => UnionRenderers.create() ],
    }))

    this.internal<IndexedDataSource.Props>(({AnyRef}) => ({
      inspected: [ AnyRef(), () => Selection.create() ],
    }))
  }

  override setv<T extends Attrs>(changed_attrs: Partial<T>, options: HasProps.SetOptions = {}): void {
    this._with_selection_sync(options.sync, () => super.setv(changed_attrs, options))
  }

  override connect_signals(): void {
    super.connect_signals()
    const prune = () => {
      const length = this.get_length()
      if (length == null) {
        return
      }
      this._prune_selection(this.selected, length)
      this._prune_selection(this.inspected, length)
      for (const inspection of this.selection_manager.inspectors.values()) {
        if (inspection != this.inspected) {
          this._prune_selection(inspection, length)
        }
      }
    }
    this.connect(this.change, prune)
    this.connect(this.data_changed, prune)
  }

  /** The number of logical records, or null when it isn't known. */
  abstract get_length(): number | null

  /**
   * A logical field indexed by record. Field items may themselves be nested,
   * ragged, or shaped values. Implementations need not store fields as columns.
   */
  abstract get_field(name: string): Arrayable | null

  /**
   * Read positional lookup indices into the target's current row order.
   * Overrides preserve the index structure and leave get_field() unchanged.
   */
  get_index_field(name: string, _target: IndexedDataSource): Arrayable | null {
    return this.get_field(name)
  }

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

  protected _prune_selection(selected: Selection, length: number): void {
    const in_bounds = (index: number) => 0 <= index && index < length

    const updates: Partial<Selection.Attrs> = {}
    const prune = <T>(values: Iterable<T>, predicate: (value: T) => boolean): T[] | null => {
      const array = Array.from(values)
      const previous_length = array.length
      inplace_filter(array, predicate)
      return array.length == previous_length ? null : array
    }

    const indices = prune(selected.indices, in_bounds)
    if (indices != null) {
      updates.indices = indices
    }

    const line_indices = prune(selected.line_indices, in_bounds)
    if (line_indices != null) {
      updates.line_indices = line_indices
    }

    const multiline_entries = prune(selected.multiline_indices, ([index]) => in_bounds(index))
    if (multiline_entries != null) {
      updates.multiline_indices = new Map(multiline_entries)
    }

    const image_indices = prune(selected.image_indices, ({index}) => in_bounds(index))
    if (image_indices != null) {
      updates.image_indices = image_indices
    }

    if (entries(updates).length != 0) {
      selected.setv(updates, {check_eq: false, sync: this._selection_sync})
    }
  }
}
