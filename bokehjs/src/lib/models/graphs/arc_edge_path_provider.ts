import {EdgePathProvider} from "./edge_path_provider"
import type {EdgePaths} from "./edge_path_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import type {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace ArcEdgePathProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EdgePathProvider.Props & {
    curvature: p.NumberSpec
    parallel_spacing: p.Property<number>
  }
}

export interface ArcEdgePathProvider extends ArcEdgePathProvider.Attrs {}

/** Samples circular arcs whose signed sagitta is relative to edge length. */
export class ArcEdgePathProvider extends EdgePathProvider {
  declare properties: ArcEdgePathProvider.Props

  static {
    this.define<ArcEdgePathProvider.Props>(({Float}) => ({
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
      const curvature = curvatures.get(i) + ranks[i]*this.parallel_spacing
      const sagitta = curvature*distance
      if (!Number.isFinite(distance) || distance == 0 || Math.abs(sagitta) < 1e-12) {
        xs.push([start[0], end[0]])
        ys.push([start[1], end[1]])
        continue
      }

      const nx = -dy/distance
      const ny = dx/distance
      const mx = (start[0] + end[0])/2
      const my = (start[1] + end[1])/2
      const center_offset = sagitta/2 - distance*distance/(8*sagitta)
      const cx = mx + nx*center_offset
      const cy = my + ny*center_offset
      const radius = Math.hypot(start[0] - cx, start[1] - cy)
      const start_angle = Math.atan2(start[1] - cy, start[0] - cx)
      const end_angle = Math.atan2(end[1] - cy, end[0] - cx)
      let delta = Math.atan2(Math.sin(end_angle - start_angle), Math.cos(end_angle - start_angle))
      const middle_angle = start_angle + delta/2
      const middle_offset = (cx + radius*Math.cos(middle_angle) - mx)*nx + (cy + radius*Math.sin(middle_angle) - my)*ny
      if (middle_offset*sagitta < 0) {
        delta += delta > 0 ? -2*Math.PI : 2*Math.PI
      }

      const edge_xs = new Float64Array(steps + 1)
      const edge_ys = new Float64Array(steps + 1)
      for (let j = 0; j <= steps; j++) {
        const angle = start_angle + delta*j/steps
        edge_xs[j] = cx + radius*Math.cos(angle)
        edge_ys[j] = cy + radius*Math.sin(angle)
      }
      xs.push(edge_xs)
      ys.push(edge_ys)
    }
    return [xs, ys]
  }
}
