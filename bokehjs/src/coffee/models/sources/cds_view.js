/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model";
import * as p from "core/properties";
import {create_hit_test_result} from "core/hittest";
import {intersection, range} from "core/util/array";
import {ColumnarDataSource} from "./columnar_data_source"
;

export class CDSView extends Model {
  static initClass() {
    this.prototype.type = 'CDSView';

    this.define({
       filters: [ p.Array, [] ],
       source:  [ p.Instance  ]
      });

    this.internal({
        indices:     [ p.Array, [] ],
        indices_map: [ p.Any,   {} ]
      });
  }

  initialize(options) {
    super.initialize(options);

    return this.compute_indices();
  }

  connect_signals() {
    super.connect_signals();
    this.connect(this.properties.filters.change, function() {
      this.compute_indices();
      return this.change.emit();
    });
    if ((this.source != null ? this.source.change : undefined) != null) {
      this.connect(this.source.change, function() { return this.compute_indices(); });
    }
    if ((this.source != null ? this.source.streaming : undefined) != null) {
      this.connect(this.source.streaming, function() { return this.compute_indices(); });
    }
    if ((this.source != null ? this.source.patching : undefined) != null) {
      return this.connect(this.source.patching, function() { return this.compute_indices(); });
    }
  }

  compute_indices() {
    let indices = (Array.from(this.filters).map((filter) => filter.compute_indices(this.source)));
    indices = ((() => {
      const result = [];
      for (let inds of Array.from(indices)) {         if (inds != null) {
          result.push(inds);
        }
      }
      return result;
    })());
    if (indices.length > 0) {
      this.indices = intersection.apply(this, indices);
    } else {
      if (this.source instanceof ColumnarDataSource) {
        this.indices = this.source != null ? this.source.get_indices() : undefined;
      }
    }

    return this.indices_map_to_subset();
  }

  indices_map_to_subset() {
    this.indices_map = {};
    return range(0, this.indices.length).map((i) =>
      (this.indices_map[this.indices[i]] = i));
  }

  convert_selection_from_subset(selection_subset) {
    const selection_full = create_hit_test_result();
    selection_full.update_through_union(selection_subset);
    const indices_1d = (Array.from(selection_subset['1d']['indices']).map((i) => this.indices[i]));
    selection_full['1d']['indices'] = indices_1d;
    return selection_full;
  }

  convert_selection_to_subset(selection_full) {
    const selection_subset = create_hit_test_result();
    selection_subset.update_through_union(selection_full);
    const indices_1d = (Array.from(selection_full['1d']['indices']).map((i) => this.indices_map[i]));
    selection_subset['1d']['indices'] = indices_1d;
    return selection_subset;
  }

  convert_indices_from_subset(indices) {
    return (Array.from(indices).map((i) => this.indices[i]));
  }
}
CDSView.initClass();
