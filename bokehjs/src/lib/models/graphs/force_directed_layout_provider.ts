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

/** Deterministic dependency-free Fruchterman-Reingold graph layout. */
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
    const id_to_index = new Map<unknown, number>()
    for (let i = 0; i < n; i++) {
      if (!id_to_index.has(ids[i])) {
        id_to_index.set(ids[i], i)
      }
    }

    const edges: [number, number][] = []
    const m = Math.min(source.edge_starts.length, source.edge_ends.length)
    for (let i = 0; i < m; i++) {
      const start = id_to_index.get(source.edge_starts[i])
      const end = id_to_index.get(source.edge_ends[i])
      if (start != null && end != null && start != end) {
        edges.push([start, end])
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
