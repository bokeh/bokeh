import {Model} from "../../model"
import type * as p from "core/properties"
import type {Selection} from "../selections/selection"
import {View} from "core/view"
import {Indices} from "core/types"
import {Filter} from "../filters/filter"
import {AllIndices} from "../filters/all_indices"
import {IntersectionFilter} from "../filters/intersection_filter"
import type {ColumnarDataSource} from "./columnar_data_source"

export class CDSViewView extends View {
  declare model: CDSView
  declare readonly parent: View & {readonly data_source: p.Property<ColumnarDataSource>}

  override initialize(): void {
    super.initialize()
    this.compute_indices()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {filter} = this.model.properties
    this.on_change(filter, () => this.compute_indices())

    const connect_listeners = () => {
      const fn = () => this.compute_indices()
      const source = this.parent.data_source.get_value()
      this.connect(source.change, fn)
      this.connect(source.streaming, fn)
      this.connect(source.patching, fn)
      this.connect(source.properties.data.change, fn)
    }

    connect_listeners()

    const {data_source} = this.parent
    this.on_change(data_source, () => {
      // TODO: disconnect
      connect_listeners()
    })
  }

  compute_indices(): void {
    // XXX: if the data source is empty, there still may be one
    // index originating from glyph's scalar values.
    const source = this.parent.data_source.get_value()

    const size = source.get_length() ?? 1
    const indices = Indices.all_set(size)

    const filtered = this.model.filter.compute_indices(source)
    indices.intersect(filtered)

    this.model.indices = indices
    this.model._indices_map_to_subset()
  }
}

export namespace CDSView {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    filter: p.Property<Filter>
    // internal
    indices: p.Property<Indices>
    indices_map: p.Property<Map<number, number>>
    masked: p.Property<Indices | null>
  }
}

export interface CDSView extends CDSView.Attrs {}

export class CDSView extends Model {
  declare properties: CDSView.Props
  declare __view_type__: CDSViewView

  constructor(attrs?: Partial<CDSView.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CDSViewView

    this.define<CDSView.Props>(({Ref}) => ({
      filter: [ Ref(Filter), () => new AllIndices() ],
    }))

    this.internal<CDSView.Props>(({Int, Map, Ref, Nullable}) => ({
      indices:     [ Ref(Indices) ],
      indices_map: [ Map(Int, Int), new globalThis.Map() ],
      masked:      [ Nullable(Ref(Indices)), null ],
    }))
  }

  private _indices: number[]

  _indices_map_to_subset(): void {
    this._indices = [...this.indices]
    this.indices_map = new Map()
    const n = this._indices.length
    for (let subset_i = 0; subset_i < n; subset_i++) {
      const fullset_i = this._indices[subset_i]
      this.indices_map.set(fullset_i, subset_i)
    }
  }

  convert_selection_from_subset(selection_subset: Selection): Selection {
    return selection_subset.map((i) => this._indices[i])
  }

  convert_selection_to_subset(selection_full: Selection): Selection {
    return selection_full.map((i) => this.indices_map.get(i)!)
  }

  convert_indices_from_subset(indices: number[]): number[] {
    return indices.map((i) => this._indices[i])
  }

  /** @deprecated */
  get filters(): Filter[] {
    const {filter} = this
    if (filter instanceof IntersectionFilter) {
      return filter.operands
    } else if (filter instanceof AllIndices) {
      return []
    } else {
      return [filter]
    }
  }

  /** @deprecated */
  set filters(filters: Filter[]) {
    if (filters.length == 0) {
      this.filter = new AllIndices()
    } else if (filters.length == 1) {
      this.filter = filters[0]
    } else {
      this.filter = new IntersectionFilter({operands: filters})
    }
  }
}
