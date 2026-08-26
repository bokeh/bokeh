import {LayoutProvider} from "./layout_provider"
import type {IndexedDataSource} from "../sources/indexed_data_source"
import type {Arrayable} from "core/types"
import {dict} from "core/util/object"
import type * as p from "core/properties"
import {Float, Str, Int, Arrayable as Arr, Dict, Mapping, Or} from "core/kinds"

export const GraphLayout = Or(Dict(Arr(Float)), Mapping(Or(Int, Str), Arr(Float)))
export type GraphLayout = typeof GraphLayout["__type__"]

export namespace StaticLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    graph_layout: p.Property<GraphLayout>
  }
}

export interface StaticLayoutProvider extends StaticLayoutProvider.Attrs {}

export class StaticLayoutProvider extends LayoutProvider {
  declare properties: StaticLayoutProvider.Props

  static {
    this.define<StaticLayoutProvider.Props>(() => ({
      graph_layout: [ GraphLayout, new Map() ], // TODO: length == 2
    }))
  }

  get_node_coordinates(node_source: IndexedDataSource): [Arrayable<number>, Arrayable<number>] {
    const index = node_source.get_field("index") ?? []
    const n = index.length
    const xs = new Float64Array(n)
    const ys = new Float64Array(n)
    const graph_layout = dict(this.graph_layout)
    for (let i = 0; i < n; i++) {
      const j = index[i] as string | number
      const [x, y] = graph_layout.get(j) ?? [NaN, NaN]
      xs[i] = x
      ys[i] = y
    }
    return [xs, ys]
  }

  get_edge_coordinates(edge_source: IndexedDataSource): [Arrayable<number>[], Arrayable<number>[]] {
    const starts = (edge_source.get_field("start") ?? []) as Arrayable<string | number>
    const ends = (edge_source.get_field("end") ?? []) as Arrayable<string | number>
    const n = Math.min(starts.length, ends.length)
    const xs: number[][] = []
    const ys: number[][] = []
    const edge_xs = edge_source.get_field("xs")
    const edge_ys = edge_source.get_field("ys")
    const has_paths = edge_xs != null && edge_ys != null
    const graph_layout = dict(this.graph_layout)
    for (let i = 0; i < n; i++) {
      const in_layout = graph_layout.has(starts[i]) && graph_layout.has(ends[i])
      if (has_paths && in_layout) {
        xs.push(edge_xs[i] as number[])
        ys.push(edge_ys[i] as number[])
      } else {
        const start = graph_layout.get(starts[i]) ?? [NaN, NaN]
        const end = graph_layout.get(ends[i]) ?? [NaN, NaN]
        xs.push([start[0], end[0]])
        ys.push([start[1], end[1]])
      }
    }
    return [xs, ys]
  }
}
