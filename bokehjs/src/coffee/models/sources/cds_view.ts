/* XXX: partial */
import {Model} from "../../model"
import * as p from "core/properties"
import {create_hit_test_result, HitTestResult} from "core/hittest"
import {intersection, range} from "core/util/array"
import {ColumnarDataSource} from "./columnar_data_source"


export class CDSView extends Model {
  static initClass() {
    this.prototype.type = 'CDSView'

    this.define({
     filters: [ p.Array, [] ],
     source:  [ p.Instance  ],
    })

    this.internal({
      indices:     [ p.Array, [] ],
      indices_map: [ p.Any,   {} ],
    })
  }

  initialize(options: any): void {
    super.initialize(options)
    this.compute_indices()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.properties.filters.change, () => {
      this.compute_indices()
      this.change.emit(undefined)
    })
    if (this.source != null) {
      if (this.source.change != null)
        this.connect(this.source.change, () => this.compute_indices())
      if (this.source.streaming != null)
        this.connect(this.source.streaming, () => this.compute_indices())
      if (this.source.patching != null)
        this.connect(this.source.patching, () => this.compute_indices())
    }
  }

  compute_indices() {
    let indices = (this.filters.map((filter) => filter.compute_indices(this.source)))
    indices = ((() => {
      const result = []
      for (const inds of indices) {
        if (inds != null) {
          result.push(inds)
        }
      }
      return result
    })())
    if (indices.length > 0) {
      this.indices = intersection.apply(this, indices)
    } else {
      if (this.source instanceof ColumnarDataSource) {
        this.indices = this.source != null ? this.source.get_indices() : undefined
      }
    }

    return this.indices_map_to_subset()
  }

  indices_map_to_subset() {
    this.indices_map = {}
    return range(0, this.indices.length).map((i) =>
      (this.indices_map[this.indices[i]] = i))
  }

  convert_selection_from_subset(selection_subset): HitTestResult {
    const selection_full = create_hit_test_result()
    selection_full.update_through_union(selection_subset)
    const indices_1d = (selection_subset['1d']['indices'].map((i) => this.indices[i]))
    selection_full['1d']['indices'] = indices_1d
    return selection_full
  }

  convert_selection_to_subset(selection_full): HitTestResult {
    const selection_subset = create_hit_test_result()
    selection_subset.update_through_union(selection_full)
    const indices_1d = (selection_full['1d']['indices'].map((i) => this.indices_map[i]))
    selection_subset['1d']['indices'] = indices_1d
    return selection_subset
  }

  convert_indices_from_subset(indices) {
    return (indices.map((i) => this.indices[i]))
  }
}
CDSView.initClass()
