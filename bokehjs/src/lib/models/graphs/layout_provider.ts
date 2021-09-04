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

  abstract node_coordinates: CoordinateTransform

  abstract edge_coordinates: CoordinateTransform
}
