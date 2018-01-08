/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS202: Simplify dynamic range loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {LayoutProvider} from "./layout_provider";
import * as p from "../../core/properties"
;

export class StaticLayoutProvider extends LayoutProvider {
  static initClass() {
    this.prototype.type = "StaticLayoutProvider";

    this.define({
      graph_layout: [ p.Any, {} ]
    });
  }

  get_node_coordinates(node_source) {
    const [xs, ys] = Array.from([[], []]);
    for (let i of Array.from(node_source.data.index)) {
      const x = (this.graph_layout[i] != null) ? this.graph_layout[i][0] : NaN;
      const y = (this.graph_layout[i] != null) ? this.graph_layout[i][1] : NaN;
      xs.push(x);
      ys.push(y);
    }
    return [xs, ys];
  }

  get_edge_coordinates(edge_source) {
    const [xs, ys] = Array.from([[], []]);
    const starts = edge_source.data.start;
    const ends = edge_source.data.end;
    const has_paths = (edge_source.data.xs != null) && (edge_source.data.ys != null);
    for (let i = 0, end1 = starts.length, asc = 0 <= end1; asc ? i < end1 : i > end1; asc ? i++ : i--) {
      const in_layout = (this.graph_layout[starts[i]] != null) && (this.graph_layout[ends[i]] != null);
      if (has_paths && in_layout) {
        xs.push(edge_source.data.xs[i]);
        ys.push(edge_source.data.ys[i]);
      } else {
        var end, start;
        if (in_layout) {
          [start, end] = Array.from([this.graph_layout[starts[i]], this.graph_layout[ends[i]]]);
        } else {
          [start, end] = Array.from([[NaN, NaN], [NaN, NaN]]);
        }
        xs.push([start[0], end[0]]);
        ys.push([start[1], end[1]]);
      }
    }
    return [xs, ys];
  }
}
StaticLayoutProvider.initClass();
