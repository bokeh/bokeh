import {LayoutProvider} from "./layout_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import {LCGRandom} from "core/util/random"
import type * as p from "core/properties"

export namespace ForceDirectedLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    center: p.Property<[number, number]>
    scale: p.Property<number>
    seed: p.Property<number>
    iterations: p.Property<number>
  }
}

export interface ForceDirectedLayoutProvider extends ForceDirectedLayoutProvider.Attrs {}

/**
 * Deterministic dependency-free Fruchterman-Reingold graph layout.
 *
 * Edge direction and multiplicity do not change layout forces. The normalized
 * result is oriented horizontally along its principal axis.
 */
export class ForceDirectedLayoutProvider extends LayoutProvider {
  declare properties: ForceDirectedLayoutProvider.Props

  static {
    this.define<ForceDirectedLayoutProvider.Props>(({Float, Int, NonNegative, Positive, Tuple}) => ({
      center:     [ Tuple(Float, Float), [0, 0] ],
      scale:      [ Positive(Float), 1 ],
      seed:       [ Int, 1 ],
      iterations: [ NonNegative(Int), 100 ],
    }))
  }

  protected _compute_layout(source: GraphDataSource): NodeLayout {
    const ids = source.node_ids
    const n = ids.length
    const layout: NodeLayout = new Map()
    if (n == 0) {
      return layout
    }
    if (n == 1) {
      layout.set(ids[0], [...this.center])
      return layout
    }

    const random = new LCGRandom(this.seed)
    const xs = Float64Array.from({length: n}, () => 2*random.float() - 1)
    const ys = Float64Array.from({length: n}, () => 2*random.float() - 1)
    const edges: [number, number][] = []
    const seen_edges = new Set<string>()
    const m = Math.min(source.edge_starts.length, source.edge_ends.length)
    for (let i = 0; i < m; i++) {
      const start = source.node_index(source.edge_starts[i])
      const end = source.node_index(source.edge_ends[i])
      if (start != null && end != null && start != end) {
        // Direction and parallel edge multiplicity affect rendering, but not the
        // topology used by this undirected force simulation.
        const [u, v] = start < end ? [start, end] : [end, start]
        const key = `${u}:${v}`
        if (!seen_edges.has(key)) {
          seen_edges.add(key)
          edges.push([u, v])
        }
      }
    }

    const dx = new Float64Array(n)
    const dy = new Float64Array(n)
    const ideal = Math.sqrt(4/n)
    const epsilon = 1e-9
    for (let iteration = 0; iteration < this.iterations; iteration++) {
      dx.fill(0)
      dy.fill(0)

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const x = xs[i] - xs[j]
          const y = ys[i] - ys[j]
          const distance = Math.max(Math.hypot(x, y), epsilon)
          const force = ideal*ideal/distance
          const fx = x/distance*force
          const fy = y/distance*force
          dx[i] += fx
          dy[i] += fy
          dx[j] -= fx
          dy[j] -= fy
        }
      }

      for (const [i, j] of edges) {
        const x = xs[i] - xs[j]
        const y = ys[i] - ys[j]
        const distance = Math.max(Math.hypot(x, y), epsilon)
        const force = distance*distance/ideal
        const fx = x/distance*force
        const fy = y/distance*force
        dx[i] -= fx
        dy[i] -= fy
        dx[j] += fx
        dy[j] += fy
      }

      const temperature = 0.2*(1 - iteration/Math.max(this.iterations, 1))
      for (let i = 0; i < n; i++) {
        const displacement = Math.max(Math.hypot(dx[i], dy[i]), epsilon)
        const distance = Math.min(displacement, temperature)
        xs[i] += dx[i]/displacement*distance
        ys[i] += dy[i]/displacement*distance
      }
    }

    // A force layout has no intrinsic rotation. Aligning its principal axis
    // horizontally removes a seed-dependent diagonal tilt and gives a stable,
    // useful orientation for the usual landscape-shaped plot.
    let xmean = 0
    let ymean = 0
    for (let i = 0; i < n; i++) {
      xmean += xs[i]
      ymean += ys[i]
    }
    xmean /= n
    ymean /= n

    let xx = 0
    let xy = 0
    let yy = 0
    for (let i = 0; i < n; i++) {
      const x = xs[i] - xmean
      const y = ys[i] - ymean
      xx += x*x
      xy += x*y
      yy += y*y
    }
    const angle = 0.5*Math.atan2(2*xy, xx - yy)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    for (let i = 0; i < n; i++) {
      const x = xs[i] - xmean
      const y = ys[i] - ymean
      xs[i] = x*cos + y*sin
      ys[i] = -x*sin + y*cos
    }

    let xmin = Infinity
    let xmax = -Infinity
    let ymin = Infinity
    let ymax = -Infinity
    for (let i = 0; i < n; i++) {
      xmin = Math.min(xmin, xs[i])
      xmax = Math.max(xmax, xs[i])
      ymin = Math.min(ymin, ys[i])
      ymax = Math.max(ymax, ys[i])
    }
    const span = Math.max(xmax - xmin, ymax - ymin, epsilon)
    const xmid = (xmin + xmax)/2
    const ymid = (ymin + ymax)/2
    const factor = 2*this.scale/span
    const [cx, cy] = this.center
    for (let i = 0; i < n; i++) {
      layout.set(ids[i], [cx + (xs[i] - xmid)*factor, cy + (ys[i] - ymid)*factor])
    }
    return layout
  }
}
