import {Model} from "../../model"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {CoordinateTransform} from "models/expressions/coordinate_transform"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace LayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {
  override properties: LayoutProvider.Props

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

export namespace NodeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateTransform.Props & {
    layout: p.Property<LayoutProvider>
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
      layout: [ Ref(LayoutProvider)],
    }))
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>, y: Arrayable<number>}{
    const [x, y] = this.layout.get_node_coordinates(source)
    return {x, y}
  }
}

export namespace EdgeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateTransform.Props & {
    layout: p.Property<LayoutProvider>
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
      layout: [ Ref(LayoutProvider)],
    }))
  }

  _v_compute(source: ColumnarDataSource): {x: Arrayable<number>[], y: Arrayable<number>[]}{
    const [x, y] = this.layout.get_edge_coordinates(source)
    return {x, y}
  }
}
