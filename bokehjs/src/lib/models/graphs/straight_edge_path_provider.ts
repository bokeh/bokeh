import {EdgePathProvider} from "./edge_path_provider"
import type {EdgePaths} from "./edge_path_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace StraightEdgePathProvider {
  export type Attrs = p.AttrsOf<Props>
  export type Props = EdgePathProvider.Props
}

export interface StraightEdgePathProvider extends StraightEdgePathProvider.Attrs {}

/** Connects distinct nodes with straight segments and renders self-loops. */
export class StraightEdgePathProvider extends EdgePathProvider {
  declare properties: StraightEdgePathProvider.Props

  protected _compute_paths(source: GraphDataSource, layout: NodeLayout): EdgePaths {
    const xs: Arrayable<number>[] = []
    const ys: Arrayable<number>[] = []
    const radii = this.properties.loop_radius.uniform(source.edges)
    const ranks = this._parallel_ranks(source)
    const n = Math.min(source.edge_starts.length, source.edge_ends.length)
    for (let i = 0; i < n; i++) {
      const [start, end] = this._endpoints(source, layout, i)
      if (source.edge_starts[i] === source.edge_ends[i]) {
        const radius = radii.get(i)*(1 + ranks[i]*this.loop_spacing)
        const [edge_xs, edge_ys] = this._loop(start, radius)
        xs.push(edge_xs)
        ys.push(edge_ys)
      } else {
        xs.push([start[0], end[0]])
        ys.push([start[1], end[1]])
      }
    }
    return [xs, ys]
  }
}
