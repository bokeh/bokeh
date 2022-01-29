import {LayoutProvider} from "./layout_provider"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Arrayable} from "core/types"
import {Dict} from "core/util/object"
import * as p from "core/properties"

export namespace StaticLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    graph_layout: p.Property<Map<number, Arrayable<number>>>
  }
}

export interface StaticLayoutProvider extends StaticLayoutProvider.Attrs {}

export class StaticLayoutProvider extends LayoutProvider {
  override properties: StaticLayoutProvider.Props

  constructor(attrs?: Partial<StaticLayoutProvider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StaticLayoutProvider.Props>(({Number, Int, Arrayable, Map}) => ({
      graph_layout: [ Map(Int, Arrayable(Number)), new globalThis.Map() ], // TODO: length == 2
    }))
  }

  get_node_coordinates(node_source: ColumnarDataSource): [Arrayable<number>, Arrayable<number>] {
    const data = new Dict(node_source.data)
    const index = data.get("index") ?? []
    const n = index.length
    const xs = new Float64Array(n)
    const ys = new Float64Array(n)
    const {graph_layout} = this
    for (let i = 0; i < n; i++) {
      const j = index[i]
      const [x, y] = graph_layout.get(j) ?? [NaN, NaN]
      xs[i] = x
      ys[i] = y
    }
    return [xs, ys]
  }

  get_edge_coordinates(edge_source: ColumnarDataSource): [Arrayable<number>[], Arrayable<number>[]] {
    const data = new Dict(edge_source.data)
    const starts = data.get("start") ?? []
    const ends = data.get("end") ?? []
    const n = Math.min(starts.length, ends.length)
    const xs: number[][] = []
    const ys: number[][] = []
    const edge_xs = data.get("xs")
    const edge_ys = data.get("ys")
    const has_paths = edge_xs != null && edge_ys != null
    const {graph_layout} = this
    for (let i = 0; i < n; i++) {
      const in_layout = graph_layout.has(starts[i]) && graph_layout.has(ends[i])
      if (has_paths && in_layout) {
        xs.push(edge_xs[i])
        ys.push(edge_ys[i])
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
