import {LayoutProvider} from "./layout_provider"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {NumberArray, RaggedArray} from "core/types"
import * as p from "core/properties"

export namespace StaticLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    graph_layout: p.Property<{[key: string]: [number, number]}>
  }
}

export interface StaticLayoutProvider extends StaticLayoutProvider.Attrs {}

export class StaticLayoutProvider extends LayoutProvider {
  properties: StaticLayoutProvider.Props

  constructor(attrs?: Partial<StaticLayoutProvider.Attrs>) {
    super(attrs)
  }

  static init_StaticLayoutProvider(): void {
    this.define<StaticLayoutProvider.Props>({
      graph_layout: [ p.Any, {} ],
    })
  }

  get_node_coordinates(node_source: ColumnarDataSource): [NumberArray, NumberArray] {
    const index = node_source.data.index
    const n = index.length
    const xs = new NumberArray(n)
    const ys = new NumberArray(n)
    for (let i = 0; i < n; i++) {
      const point = this.graph_layout[index[i]]
      const [x, y] = point ?? [NaN, NaN]
      xs[i] = x
      ys[i] = y
    }
    return [xs, ys]
  }

  get_edge_coordinates(edge_source: ColumnarDataSource): [RaggedArray, RaggedArray] {
    const starts = edge_source.data.start
    const ends = edge_source.data.end
    const n = starts.length
    const xs: number[][] = []
    const ys: number[][] = []
    const has_paths = edge_source.data.xs != null && edge_source.data.ys != null
    for (let i = 0; i < n; i++) {
      const in_layout = this.graph_layout[starts[i]] != null && this.graph_layout[ends[i]] != null
      if (has_paths && in_layout) {
        xs.push(edge_source.data.xs[i])
        ys.push(edge_source.data.ys[i])
      } else {
        let start, end
        if (in_layout) {
          start = this.graph_layout[starts[i]]
          end = this.graph_layout[ends[i]]
        } else {
          start = [NaN, NaN]
          end = [NaN, NaN]
        }
        xs.push([start[0], end[0]])
        ys.push([start[1], end[1]])
      }
    }
    return [
      RaggedArray.from(xs),
      RaggedArray.from(ys),
    ]
  }
}
