import {LayoutProvider} from "./layout_provider"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import * as p from "../../core/properties"

export namespace StaticLayoutProvider {
  export interface Attrs extends LayoutProvider.Attrs {
    graph_layout: {[key: string]: [number, number]}
  }

  export interface Props extends LayoutProvider.Props {}
}

export interface StaticLayoutProvider extends StaticLayoutProvider.Attrs {}

export class StaticLayoutProvider extends LayoutProvider {

  properties: StaticLayoutProvider.Props

  constructor(attrs?: Partial<StaticLayoutProvider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "StaticLayoutProvider"

    this.define({
      graph_layout: [ p.Any, {} ],
    })
  }

  get_node_coordinates(node_source: ColumnarDataSource): [number[], number[]] {
    const xs: number[] = []
    const ys: number[] = []
    const index = node_source.data.index
    for (let i = 0, end = index.length; i < end; i++) {
      const point = this.graph_layout[index[i]]
      const [x, y] = point != null ? point : [NaN, NaN]
      xs.push(x)
      ys.push(y)
    }
    return [xs, ys]
  }

  get_edge_coordinates(edge_source: ColumnarDataSource): [[number, number][], [number, number][]] {
    const xs: [number, number][] = []
    const ys: [number, number][] = []
    const starts = edge_source.data.start
    const ends = edge_source.data.end
    const has_paths = (edge_source.data.xs != null) && (edge_source.data.ys != null)
    for (let i = 0, endi = starts.length; i < endi; i++) {
      const in_layout = (this.graph_layout[starts[i]] != null) && (this.graph_layout[ends[i]] != null)
      if (has_paths && in_layout) {
        xs.push(edge_source.data.xs[i])
        ys.push(edge_source.data.ys[i])
      } else {
        let end, start
        if (in_layout)
          [start, end] = [this.graph_layout[starts[i]], this.graph_layout[ends[i]]]
        else
          [start, end] = [[NaN, NaN], [NaN, NaN]]
        xs.push([start[0], end[0]])
        ys.push([start[1], end[1]])
      }
    }
    return [xs, ys]
  }
}
StaticLayoutProvider.initClass()
