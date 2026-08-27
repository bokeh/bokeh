import {EdgePathProvider} from "./edge_path_provider"
import type {EdgePath, EdgePaths, Point} from "./edge_path_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import type {Arrayable} from "core/types"
import {Enum} from "core/kinds"
import * as p from "core/properties"

export const OrthogonalOrientation = Enum("horizontal", "vertical")
export type OrthogonalOrientation = typeof OrthogonalOrientation["__type__"]

export namespace OrthogonalEdgePathProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = EdgePathProvider.Props & {
    orientation: p.Property<OrthogonalOrientation>
    offset: p.NumberSpec
    corner_radius: p.NumberSpec
  }
}

export interface OrthogonalEdgePathProvider extends OrthogonalEdgePathProvider.Attrs {}

/** Routes edges with horizontal and vertical segments and optional rounded corners. */
export class OrthogonalEdgePathProvider extends EdgePathProvider {
  declare properties: OrthogonalEdgePathProvider.Props

  static {
    this.define<OrthogonalEdgePathProvider.Props>(() => ({
      orientation:   [ OrthogonalOrientation, "horizontal" ],
      offset:        [ p.NumberSpec, 0 ],
      corner_radius: [ p.NumberSpec, 0 ],
    }))
  }

  private _rounded(points: Point[], radius: number): EdgePath {
    const r = Math.abs(radius)
    if (r == 0) {
      return [points.map(([x]) => x), points.map(([, y]) => y)]
    }

    const output: Point[] = [points[0]]
    const steps = Math.max(1, this.steps)
    for (let i = 1; i < points.length - 1; i++) {
      const [ax, ay] = points[i - 1]
      const [bx, by] = points[i]
      const [cx, cy] = points[i + 1]
      const in_dx = bx - ax
      const in_dy = by - ay
      const out_dx = cx - bx
      const out_dy = cy - by
      const in_length = Math.hypot(in_dx, in_dy)
      const out_length = Math.hypot(out_dx, out_dy)
      if (in_length == 0 || out_length == 0) {
        output.push(points[i])
        continue
      }

      const trim = Math.min(r, in_length/2, out_length/2)
      const before: Point = [bx - in_dx/in_length*trim, by - in_dy/in_length*trim]
      const after: Point = [bx + out_dx/out_length*trim, by + out_dy/out_length*trim]
      output.push(before)
      for (let j = 1; j <= steps; j++) {
        const t = j/steps
        const u = 1 - t
        output.push([
          u*u*before[0] + 2*u*t*bx + t*t*after[0],
          u*u*before[1] + 2*u*t*by + t*t*after[1],
        ])
      }
    }
    output.push(points[points.length - 1])
    return [output.map(([x]) => x), output.map(([, y]) => y)]
  }

  protected _compute_paths(source: GraphDataSource, layout: NodeLayout): EdgePaths {
    const xs: Arrayable<number>[] = []
    const ys: Arrayable<number>[] = []
    const offsets = this.properties.offset.uniform(source.edges)
    const corner_radii = this.properties.corner_radius.uniform(source.edges)
    const loop_radii = this.properties.loop_radius.uniform(source.edges)
    const ranks = this._parallel_ranks(source)
    const n = Math.min(source.edge_starts.length, source.edge_ends.length)

    for (let i = 0; i < n; i++) {
      const [start, end] = this._endpoints(source, layout, i)
      if (source.edge_starts[i] === source.edge_ends[i]) {
        const radius = loop_radii.get(i)*(1 + ranks[i]*this.loop_spacing)
        const [edge_xs, edge_ys] = this._loop(start, radius)
        xs.push(edge_xs)
        ys.push(edge_ys)
        continue
      }

      const offset = offsets.get(i)
      const points: Point[] = this.orientation == "horizontal"
        ? [start, [(start[0] + end[0])/2 + offset, start[1]], [(start[0] + end[0])/2 + offset, end[1]], end]
        : [start, [start[0], (start[1] + end[1])/2 + offset], [end[0], (start[1] + end[1])/2 + offset], end]
      const [edge_xs, edge_ys] = this._rounded(points, corner_radii.get(i))
      xs.push(edge_xs)
      ys.push(edge_ys)
    }
    return [xs, ys]
  }
}
