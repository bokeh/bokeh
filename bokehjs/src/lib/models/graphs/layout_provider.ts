import {Model} from "../../model"
import type {IndexedDataSource} from "../sources/indexed_data_source"
import {CoordinateTransform} from "models/expressions/coordinate_transform"
import type {Arrayable} from "core/types"
import {dict} from "core/util/object"
import type * as p from "core/properties"

export namespace LayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {
  declare properties: LayoutProvider.Props

  abstract get_node_coordinates(graph_source: IndexedDataSource): [Arrayable<number>, Arrayable<number>]

  abstract get_edge_coordinates(graph_source: IndexedDataSource): [Arrayable<number>[], Arrayable<number>[]]

  /** Cubic controls, optionally supplied as four per-edge columns. */
  get_edge_control_coordinates(source: ColumnarDataSource): [Arrayable<number>, Arrayable<number>, Arrayable<number>, Arrayable<number>] {
    const data = dict(source.data)
    const names = ["cx0", "cy0", "cx1", "cy1"]
    const columns = names.map(name => data.get(name))
    const [xs, ys] = this.get_edge_coordinates(source)
    if (columns.some(column => column != null)) {
      if (columns.some(column => column == null || column.length != xs.length)) {
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

  edge_point_coordinates(point: "start" | "end" | "control0" | "control1"): EdgePointCoordinates {
    return EdgePointCoordinates.create({layout: this, point})
  }

  get node_coordinates(): NodeCoordinates {
    return NodeCoordinates.create({layout: this})
  }

  get edge_coordinates(): EdgeCoordinates {
    return EdgeCoordinates.create({layout: this})
  }
}

export namespace GraphCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateTransform.Props & {
    layout: p.Property<LayoutProvider>
  }
}

export interface GraphCoordinates extends GraphCoordinates.Attrs {}

export abstract class GraphCoordinates extends CoordinateTransform {
  declare properties: GraphCoordinates.Props

  static {
    this.define<GraphCoordinates.Props>(({Ref}) => ({
      layout: [ Ref(LayoutProvider)],
    }))
  }
}

export namespace NodeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GraphCoordinates.Props
}

export interface NodeCoordinates extends NodeCoordinates.Attrs {}

export class NodeCoordinates extends GraphCoordinates {
  declare properties: NodeCoordinates.Props

  _v_compute(source: IndexedDataSource): {x: Arrayable<number>, y: Arrayable<number>} {
    const [x, y] = this.layout.get_node_coordinates(source)
    return {x, y}
  }
}

export namespace EdgeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GraphCoordinates.Props
}

export interface EdgeCoordinates extends EdgeCoordinates.Attrs {}

export class EdgeCoordinates extends GraphCoordinates {
  declare properties: EdgeCoordinates.Props

  _v_compute(source: IndexedDataSource): {x: Arrayable<number>[], y: Arrayable<number>[]} {
    const [x, y] = this.layout.get_edge_coordinates(source)
    return {x, y}
  }
}

export namespace EdgePointCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GraphCoordinates.Props & {
    point: p.Property<"start" | "end" | "control0" | "control1">
  }
}

export interface EdgePointCoordinates extends EdgePointCoordinates.Attrs {}

export class EdgePointCoordinates extends GraphCoordinates {
  declare properties: EdgePointCoordinates.Props

  static {
    this.define<EdgePointCoordinates.Props>(({Enum}) => ({
      point: [ Enum("start", "end", "control0", "control1") ],
    }))
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>, y: Arrayable<number>} {
    if (this.point == "control0" || this.point == "control1") {
      const [cx0, cy0, cx1, cy1] = this.layout.get_edge_control_coordinates(source)
      return this.point == "control0" ? {x: cx0, y: cy0} : {x: cx1, y: cy1}
    }
    const [xs, ys] = this.layout.get_edge_coordinates(source)
    const first = this.point == "start"
    return {
      x: Float64Array.from(xs, path => path[first ? 0 : path.length - 1] ?? NaN),
      y: Float64Array.from(ys, path => path[first ? 0 : path.length - 1] ?? NaN),
    }
  }
}
