import {Model} from "../../model"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {CoordinateTransform} from "models/expressions/coordinate_transform"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace LayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {
  declare properties: LayoutProvider.Props

  constructor(attrs?: Partial<LayoutProvider.Attrs>) {
    super(attrs)
  }

  abstract get_node_coordinates(graph_source: ColumnarDataSource): [Arrayable<number>, Arrayable<number>]

  abstract get_edge_coordinates(graph_source: ColumnarDataSource): [Arrayable<number>[], Arrayable<number>[]]

  get node_coordinates(): NodeCoordinates {
    return new NodeCoordinates({layout: this})
  }

  get edge_coordinates(): EdgeCoordinates {
    return new EdgeCoordinates({layout: this})
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

  constructor(attrs?: Partial<GraphCoordinates.Attrs>) {
    super(attrs)
  }

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

  constructor(attrs?: Partial<NodeCoordinates.Attrs>) {
    super(attrs)
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>, y: Arrayable<number>} {
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

  constructor(attrs?: Partial<EdgeCoordinates.Attrs>) {
    super(attrs)
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>[], y: Arrayable<number>[]} {
    const [x, y] = this.layout.get_edge_coordinates(source)
    return {x, y}
  }
}
