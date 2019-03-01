import {Model} from "../../model"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {intersection} from "core/util/array"
import {Filter} from "../filters/filter"
import {ColumnarDataSource} from "./columnar_data_source"

export namespace CDSView {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    filters: p.Property<Filter[]>
    source: p.Property<ColumnarDataSource>
    indices: p.Property<number[]>
    indices_map: p.Property<{[key: string]: number}>
  }
}

export interface CDSView extends CDSView.Attrs {}

export class CDSView extends Model {
  properties: CDSView.Props

  constructor(attrs?: Partial<CDSView.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'CDSView'

    this.define<CDSView.Props>({
      filters: [ p.Array, [] ],
      source:  [ p.Instance  ],
    })

    this.internal({
      indices:     [ p.Array, [] ],
      indices_map: [ p.Any,   {} ],
    })
  }

  initialize(): void {
    super.initialize()
    this.compute_indices()
  }

  connect_signals(): void {
    super.connect_signals()

    this.connect(this.properties.filters.change, () => {
      this.compute_indices()
      this.change.emit()
    })

    const connect_listeners = () => {
      const fn = () => this.compute_indices()

      if (this.source != null) {
        this.connect(this.source.change, fn)

        if (this.source instanceof ColumnarDataSource) {
          this.connect(this.source.streaming, fn)
          this.connect(this.source.patching, fn)
        }
      }
    }

    let initialized = this.source != null

    if (initialized)
      connect_listeners()
    else {
      this.connect(this.properties.source.change, () => {
        if (!initialized) {
          connect_listeners()
          initialized = true
        }
      })
    }
  }

  compute_indices(): void {
    const indices = this.filters.map((filter) => filter.compute_indices(this.source))
                                .filter((indices) => indices != null)

    if (indices.length > 0)
      this.indices = intersection.apply(this, indices)
    else if (this.source instanceof ColumnarDataSource)
      this.indices = this.source.get_indices()

    this.indices_map_to_subset()
  }

  indices_map_to_subset(): void {
    this.indices_map = {}
    for (let i = 0; i < this.indices.length; i++){
      this.indices_map[this.indices[i]] = i
    }
  }

  convert_selection_from_subset(selection_subset: Selection): Selection {
    const selection_full = new Selection()
    selection_full.update_through_union(selection_subset)
    const indices_1d = selection_subset.indices.map((i) => this.indices[i])
    selection_full.indices = indices_1d
    selection_full.image_indices = selection_subset.image_indices
    return selection_full
  }

  convert_selection_to_subset(selection_full: Selection): Selection {
    const selection_subset = new Selection()
    selection_subset.update_through_union(selection_full)
    const indices_1d = selection_full.indices.map((i) => this.indices_map[i])
    selection_subset.indices = indices_1d
    selection_subset.image_indices = selection_full.image_indices
    return selection_subset
  }

  convert_indices_from_subset(indices: number[]): number[] {
    return indices.map((i) => this.indices[i])
  }
}
CDSView.initClass()
