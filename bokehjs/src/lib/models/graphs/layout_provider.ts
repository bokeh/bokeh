import {Model} from "../../model"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Arrayable, NumberArray} from "core/types"
import * as p from "core/properties"

export namespace LayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {
  properties: LayoutProvider.Props

  constructor(attrs?: Partial<LayoutProvider.Attrs>) {
    super(attrs)
  }

  abstract get_node_coordinates(graph_source: ColumnarDataSource): [NumberArray, NumberArray]

  abstract get_edge_coordinates(graph_source: ColumnarDataSource): [Arrayable<number>[], Arrayable<number>[]]
}
