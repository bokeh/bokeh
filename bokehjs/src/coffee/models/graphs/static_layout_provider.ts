/* XXX: partial */
import {LayoutProvider} from "./layout_provider";
import * as p from "../../core/properties"

export class StaticLayoutProvider extends LayoutProvider {
  static initClass() {
    this.prototype.type = "StaticLayoutProvider";

    this.define({
      graph_layout: [ p.Any, {} ]
    });
  }

  get_node_coordinates(node_source) {
    const [xs, ys] = [[], []];
    for (const i of node_source.data.index) {
      const x = (this.graph_layout[i] != null) ? this.graph_layout[i][0] : NaN;
      const y = (this.graph_layout[i] != null) ? this.graph_layout[i][1] : NaN;
      xs.push(x);
      ys.push(y);
    }
    return [xs, ys];
  }

  get_edge_coordinates(edge_source) {
    const [xs, ys] = [[], []];
    const starts = edge_source.data.start;
    const ends = edge_source.data.end;
    const has_paths = (edge_source.data.xs != null) && (edge_source.data.ys != null);
    for (let i = 0, end1 = starts.length, asc = 0 <= end1; asc ? i < end1 : i > end1; asc ? i++ : i--) {
      const in_layout = (this.graph_layout[starts[i]] != null) && (this.graph_layout[ends[i]] != null);
      if (has_paths && in_layout) {
        xs.push(edge_source.data.xs[i]);
        ys.push(edge_source.data.ys[i]);
      } else {
        let end, start;
        if (in_layout) {
          [start, end] = [this.graph_layout[starts[i]], this.graph_layout[ends[i]]];
        } else {
          [start, end] = [[NaN, NaN], [NaN, NaN]];
        }
        xs.push([start[0], end[0]]);
        ys.push([start[1], end[1]]);
      }
    }
    return [xs, ys];
  }
}
StaticLayoutProvider.initClass();
