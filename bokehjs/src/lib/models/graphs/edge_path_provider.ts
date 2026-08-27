import {Model} from "../../model"
import type {Arrayable} from "core/types"
import {isArrayable} from "core/util/types"
import * as p from "core/properties"
import type {GraphDataSource} from "../sources/graph_data_source"
import {GraphCoordinates} from "./layout_provider"
import type {LayoutProvider, NodeLayout} from "./layout_provider"

export type Point = [number, number]
export type EdgePath = [Arrayable<number>, Arrayable<number>]
export type EdgePaths = [Arrayable<number>[], Arrayable<number>[]]

export namespace EdgePathProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    loop_radius: p.NumberSpec
    loop_spacing: p.Property<number>
    steps: p.Property<number>
  }
}

export interface EdgePathProvider extends EdgePathProvider.Attrs {}

/** Computes sampled edge paths from graph topology and node positions. */
export abstract class EdgePathProvider extends Model {
  declare properties: EdgePathProvider.Props

  static {
    this.define<EdgePathProvider.Props>(({Float, Int, NonNegative, Positive}) => ({
      loop_radius: [ p.NumberSpec, 0.15 ],
      loop_spacing: [ NonNegative(Float), 0.25 ],
      steps:       [ Positive(Int), 24 ],
    }))
  }

  protected abstract _compute_paths(source: GraphDataSource, layout: NodeLayout): EdgePaths

  protected _endpoints(source: GraphDataSource, layout: NodeLayout, index: number): [Point, Point] {
    const start = layout.get(source.edge_starts[index]) ?? [NaN, NaN]
    const end = layout.get(source.edge_ends[index]) ?? [NaN, NaN]
    return [[start[0], start[1]], [end[0], end[1]]]
  }

  protected _loop(point: Point, radius: number): EdgePath {
    const steps = Math.max(4, this.steps)
    const r = Math.abs(radius)
    const xs = new Float64Array(steps + 1)
    const ys = new Float64Array(steps + 1)
    const [x, y] = point
    for (let i = 0; i <= steps; i++) {
      const angle = -Math.PI/2 + 2*Math.PI*i/steps
      xs[i] = x + r*Math.cos(angle)
      ys[i] = y + r + r*Math.sin(angle)
    }
    return [xs, ys]
  }

  protected _parallel_ranks(source: GraphDataSource): Float64Array {
    const groups = new Map<unknown, Map<unknown, number[]>>()
    const n = Math.min(source.edge_starts.length, source.edge_ends.length)
    for (let i = 0; i < n; i++) {
      const start = source.edge_starts[i]
      const end = source.edge_ends[i]
      let destinations = groups.get(start)
      if (destinations == null) {
        destinations = new Map()
        groups.set(start, destinations)
      }
      const indices = destinations.get(end) ?? []
      indices.push(i)
      destinations.set(end, indices)
    }

    const ranks = new Float64Array(n)
    for (const destinations of groups.values()) {
      for (const indices of destinations.values()) {
        const self_loop = indices.length != 0 && source.edge_starts[indices[0]] === source.edge_ends[indices[0]]
        const midpoint = self_loop ? 0 : (indices.length - 1)/2
        for (let i = 0; i < indices.length; i++) {
          ranks[indices[i]] = i - midpoint
        }
      }
    }
    return ranks
  }

  get_edge_coordinates(source: GraphDataSource, layout_provider: LayoutProvider): EdgePaths {
    const paths = this._compute_paths(source, layout_provider.get_layout(source))
    const [xs, ys] = paths
    const explicit_xs = source.edges.get_field("xs")
    const explicit_ys = source.edges.get_field("ys")
    if (explicit_xs == null || explicit_ys == null) {
      return paths
    }

    const n = Math.min(xs.length, ys.length, explicit_xs.length, explicit_ys.length)
    for (let i = 0; i < n; i++) {
      const edge_xs = explicit_xs[i]
      const edge_ys = explicit_ys[i]
      if (isArrayable(edge_xs) && isArrayable(edge_ys)) {
        xs[i] = edge_xs as Arrayable<number>
        ys[i] = edge_ys as Arrayable<number>
      }
    }
    return paths
  }

  /** Cubic controls, optionally supplied as four per-edge columns. */
  get_edge_control_coordinates(source: GraphDataSource, layout_provider: LayoutProvider): [Arrayable<number>, Arrayable<number>, Arrayable<number>, Arrayable<number>] {
    const names = ["cx0", "cy0", "cx1", "cy1"]
    const columns = names.map((name) => source.edges.get_field(name))
    const [xs, ys] = this.get_edge_coordinates(source, layout_provider)
    if (columns.some((column) => column != null)) {
      if (columns.some((column) => column == null || column.length != xs.length)) {
        throw new Error("Bezier graph edges require cx0, cy0, cx1, cy1 columns with one value per edge")
      }
      return columns as [Arrayable<number>, Arrayable<number>, Arrayable<number>, Arrayable<number>]
    }
    const controls = [[], [], [], []] as number[][]
    for (let i = 0; i < xs.length; i++) {
      const x0 = xs[i][0], x1 = xs[i][xs[i].length - 1]
      const y0 = ys[i][0], y1 = ys[i][ys[i].length - 1]
      controls[0].push(x0 + (x1 - x0)/3)
      controls[1].push(y0 + (y1 - y0)/3)
      controls[2].push(x0 + 2*(x1 - x0)/3)
      controls[3].push(y0 + 2*(y1 - y0)/3)
    }
    return controls as [number[], number[], number[], number[]]
  }

  edge_coordinates(source: GraphDataSource, layout: LayoutProvider): EdgeCoordinates {
    return EdgeCoordinates.create({path: this, layout, source})
  }

  edge_point_coordinates(source: GraphDataSource, layout: LayoutProvider, point: EdgePointCoordinates["point"]): EdgePointCoordinates {
    return EdgePointCoordinates.create({path: this, layout, source, point})
  }
}

export namespace EdgeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GraphCoordinates.Props & {
    path: p.Property<EdgePathProvider>
  }
}

export interface EdgeCoordinates extends EdgeCoordinates.Attrs {}

export class EdgeCoordinates extends GraphCoordinates {
  declare properties: EdgeCoordinates.Props

  static {
    this.define<EdgeCoordinates.Props>(({Ref}) => ({
      path: [ Ref(EdgePathProvider) ],
    }))
  }

  _v_compute(): {x: Arrayable<number>[], y: Arrayable<number>[]} {
    const [x, y] = this.path.get_edge_coordinates(this.source, this.layout)
    return {x, y}
  }
}

export namespace EdgePointCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = EdgeCoordinates.Props & {
    point: p.Property<"start" | "end" | "control0" | "control1">
  }
}

export interface EdgePointCoordinates extends EdgePointCoordinates.Attrs {}

export class EdgePointCoordinates extends EdgeCoordinates {
  declare properties: EdgePointCoordinates.Props

  static {
    this.define<EdgePointCoordinates.Props>(({Enum}) => ({
      point: [ Enum("start", "end", "control0", "control1") ],
    }))
  }

  _v_compute(): {x: Arrayable<number>, y: Arrayable<number>} {
    if (this.point == "control0" || this.point == "control1") {
      const [cx0, cy0, cx1, cy1] = this.path.get_edge_control_coordinates(this.source, this.layout)
      return this.point == "control0" ? {x: cx0, y: cy0} : {x: cx1, y: cy1}
    }
    const [xs, ys] = this.path.get_edge_coordinates(this.source, this.layout)
    const first = this.point == "start"
    return {
      x: Float64Array.from(xs, (path) => path[first ? 0 : path.length - 1] ?? NaN),
      y: Float64Array.from(ys, (path) => path[first ? 0 : path.length - 1] ?? NaN),
    }
  }
}
