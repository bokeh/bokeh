import {Model} from "../../model"
import type * as p from "core/properties"
import {SubsetIndexMapper} from "core/util/indices"
import type {Selection} from "../selections/selection"
import {View} from "core/view"
import {Indices} from "core/types"
import type {Arrayable} from "core/types"
import {Filter} from "../filters/filter"
import {AllIndices} from "../filters/all_indices"
import {IntersectionFilter} from "../filters/intersection_filter"
import type {ColumnarDataSource} from "./columnar_data_source"

export class CDSViewView extends View {
  declare model: CDSView
  declare readonly parent: View & {
    readonly data_source: p.Property<ColumnarDataSource>
  }

  override initialize(): void {
    super.initialize()
    this.compute_indices()
  }

  override connect_signals(): void {
    super.connect_signals()

    const compute_indices = () => {
      this.compute_indices()
    }

    const connect_filter = (filter: Filter) => {
      this.connect(filter.change, compute_indices)
    }

    const disconnect_filter = (filter: Filter) => {
      this.disconnect(filter.change, compute_indices)
    }

    let {filter} = this.model
    connect_filter(filter)

    this.on_change(this.model.properties.filter, () => {
      disconnect_filter(filter)
      filter = this.model.filter
      connect_filter(filter)
      compute_indices()
    })

    const connect_data_source = (data_source: ColumnarDataSource) => {
      this.connect(data_source.change, compute_indices)
      this.connect(data_source.streaming, compute_indices)
      this.connect(data_source.patching, compute_indices)
      this.connect(data_source.properties.data.change, compute_indices)
    }

    const disconnect_data_source = (data_source: ColumnarDataSource) => {
      this.disconnect(data_source.change, compute_indices)
      this.disconnect(data_source.streaming, compute_indices)
      this.disconnect(data_source.patching, compute_indices)
      this.disconnect(data_source.properties.data.change, compute_indices)
    }

    let data_source = this.parent.data_source.get_value()
    connect_data_source(data_source)

    this.on_change(this.parent.data_source, () => {
      disconnect_data_source(data_source)
      data_source = this.parent.data_source.get_value()
      connect_data_source(data_source)
      compute_indices()
    })
  }

  compute_indices(): void {
    // XXX: if the data source is empty, there still may be one
    // index originating from glyph's scalar values.
    const source = this.parent.data_source.get_value()
    this.model.compute_indices(source)
  }
}

export namespace CDSView {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    filter: p.Property<Filter>
    // internal
    indices: p.Property<Indices>
    indices_map: p.Property<SubsetIndexMapper>
    masked: p.Property<Indices | null>
  }
}

export interface CDSView extends CDSView.Attrs {}

export class CDSView extends Model {
  declare properties: CDSView.Props
  declare __view_type__: CDSViewView

  protected constructor(attrs?: Partial<CDSView.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CDSViewView

    this.define<CDSView.Props>(({Ref}) => ({
      filter: [ Ref(Filter), () => AllIndices.create() ],
    }))

    this.internal<CDSView.Props>(({Ref, Nullable}) => ({
      indices:     [ Ref(Indices) ],
      indices_map: [ Ref(SubsetIndexMapper), () => new SubsetIndexMapper(0) ],
      masked:      [ Nullable(Ref(Indices)), null ],
    }))
  }

  get_subset_index(index: number): number {
    return this.indices_map.get_subset_index(index)
  }

  has_subset_index(index: number): boolean {
    return this.indices_map.has_subset_index(index)
  }

  convert_selection_from_subset(selection_subset: Selection): Selection {
    return selection_subset.map((i) => this.indices_map.get_superset_index(i))
  }

  convert_selection_to_subset(selection_full: Selection): Selection {
    return selection_full.map((i) => this.indices_map.get_subset_index(i)) // XXX ?? NaN
  }

  convert_indices_from_subset(indices: number[]): number[] {
    return this.indices_map.convert_indices_from_subset(indices)
  }

  get_reference_point(array: Arrayable, value: unknown): number | null {
    return this.indices_map.subset_index_of(array, value)
  }

  compute_indices(source: ColumnarDataSource): void {
    const size = source.get_length() ?? 1
    const indices = Indices.all_set(size)

    const filtered = this.filter.compute_indices(source)
    indices.intersect(filtered)

    this.indices = indices

    // reuse mapper if possible
    if (size !== this.indices_map.size) {
      this.indices_map = new SubsetIndexMapper(size)
    }

    this.indices_map.set_subset(indices.ones())
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
      this.filter = AllIndices.create()
    } else if (filters.length == 1) {
      this.filter = filters[0]
    } else {
      this.filter = IntersectionFilter.create({operands: filters})
    }
  }
}
