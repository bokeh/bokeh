import {EdgePathProvider} from "./edge_path_provider"
import type {EdgePaths} from "./edge_path_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import type {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace BezierEdgePathProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EdgePathProvider.Props & {
    curvature: p.NumberSpec
    parallel_spacing: p.Property<number>
  }
}

export interface BezierEdgePathProvider extends BezierEdgePathProvider.Attrs {}

/** Samples quadratic Bezier paths with a configurable midpoint offset. */
export class BezierEdgePathProvider extends EdgePathProvider {
  declare properties: BezierEdgePathProvider.Props

  static {
    this.define<BezierEdgePathProvider.Props>(({Float}) => ({
      curvature:       [ p.NumberSpec, 0.2 ],
      parallel_spacing: [ Float, 0.15 ],
    }))
  }

  protected _compute_paths(source: GraphDataSource, layout: NodeLayout): EdgePaths {
    const xs: Arrayable<number>[] = []
    const ys: Arrayable<number>[] = []
    const curvatures = this.properties.curvature.uniform(source.edges)
    const radii = this.properties.loop_radius.uniform(source.edges)
    const ranks = this._parallel_ranks(source)
    const steps = Math.max(1, this.steps)
    const n = Math.min(source.edge_starts.length, source.edge_ends.length)

    for (let i = 0; i < n; i++) {
      const [start, end] = this._endpoints(source, layout, i)
      if (source.edge_starts[i] === source.edge_ends[i]) {
        const radius = radii.get(i)*(1 + ranks[i]*this.loop_spacing)
        const [edge_xs, edge_ys] = this._loop(start, radius)
        xs.push(edge_xs)
        ys.push(edge_ys)
        continue
      }

      const dx = end[0] - start[0]
      const dy = end[1] - start[1]
      const distance = Math.hypot(dx, dy)
      if (!Number.isFinite(distance) || distance == 0) {
        xs.push([start[0], end[0]])
        ys.push([start[1], end[1]])
        continue
      }
      const curvature = curvatures.get(i) + ranks[i]*this.parallel_spacing
      const offset = 2*curvature*distance
      const cx = (start[0] + end[0])/2 - dy/distance*offset
      const cy = (start[1] + end[1])/2 + dx/distance*offset
      const edge_xs = new Float64Array(steps + 1)
      const edge_ys = new Float64Array(steps + 1)
      for (let j = 0; j <= steps; j++) {
        const t = j/steps
        const u = 1 - t
        edge_xs[j] = u*u*start[0] + 2*u*t*cx + t*t*end[0]
        edge_ys[j] = u*u*start[1] + 2*u*t*cy + t*t*end[1]
      }
      xs.push(edge_xs)
      ys.push(edge_ys)
    }
    return [xs, ys]
  }
}
