import {LayoutProvider} from "./layout_provider"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Arrayable} from "core/types"
import {CoordinateTransform} from "models/expressions/coordinate_transform"
import * as p from "core/properties"

export namespace StaticLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    graph_layout: p.Property<{[key: string]: [number, number]}>
  }
}

export interface StaticLayoutProvider extends StaticLayoutProvider.Attrs {}

export class StaticLayoutProvider extends LayoutProvider {
  override properties: StaticLayoutProvider.Props

  constructor(attrs?: Partial<StaticLayoutProvider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<StaticLayoutProvider.Props>(({Number, Tuple, Dict}) => ({
      graph_layout: [ Dict(Tuple(Number, Number)), {} ],
    }))
  }

  get_node_coordinates(graph_source: ColumnarDataSource): [Arrayable<number>, Arrayable<number>] {
    const index = graph_source.data.index ?? []
    const n = index.length
    const xs = new Float64Array(n)
    const ys = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      const point = this.graph_layout[index[i]]
      const [x, y] = point ?? [NaN, NaN]
      xs[i] = x
      ys[i] = y
    }
    return [xs, ys]
  }

  get_edge_coordinates(graph_source: ColumnarDataSource): [Arrayable<number>[], Arrayable<number>[]] {
    const starts = graph_source.data.start ?? []
    const ends = graph_source.data.end ?? []
    const n = Math.min(starts.length, ends.length)
    const xs: number[][] = []
    const ys: number[][] = []
    const has_paths = graph_source.data.xs != null && graph_source.data.ys != null
    for (let i = 0; i < n; i++) {
      const in_layout = this.graph_layout[starts[i]] != null && this.graph_layout[ends[i]] != null
      if (has_paths && in_layout) {
        xs.push(graph_source.data.xs[i])
        ys.push(graph_source.data.ys[i])
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
    return [xs, ys]
  }

  get node_coordinates(): NodeCoordinates {
    return new NodeCoordinates({layout: this})
  }

  get edge_coordinates(): EdgeCoordinates {
    return new EdgeCoordinates({layout: this})
  }
}

export namespace NodeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateTransform.Props & {
    layout: p.Property<StaticLayoutProvider>
  }
}

export interface NodeCoordinates extends NodeCoordinates.Attrs {}

export class NodeCoordinates extends CoordinateTransform {
  override properties: NodeCoordinates.Props

  constructor(attrs?: Partial<NodeCoordinates.Attrs>){
    super(attrs)
  }

  static {
    this.define<NodeCoordinates.Props>(({Ref}) => ({
      layout: [ Ref(StaticLayoutProvider)]
    }))
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>, y: Arrayable<number>}{
    const [x, y] = this.layout.get_node_coordinates(source)
    return {x: x, y: y}
  }
}


export namespace EdgeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateTransform.Props & {
    layout: p.Property<StaticLayoutProvider>
  }
}

export interface EdgeCoordinates extends EdgeCoordinates.Attrs {}

export class EdgeCoordinates extends CoordinateTransform {
  override properties: EdgeCoordinates.Props

  constructor(attrs?: Partial<EdgeCoordinates.Attrs>){
    super(attrs)
  }

  static {
    this.define<EdgeCoordinates.Props>(({Ref}) => ({
      layout: [ Ref(StaticLayoutProvider)]
    }))
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>[], y: Arrayable<number>[]}{
    const [x, y] = this.layout.get_edge_coordinates(source)
    return {x: x, y: y}
  }
}
