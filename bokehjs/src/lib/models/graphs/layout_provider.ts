import {Model} from "../../model"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace LayoutProvider {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {

  properties: LayoutProvider.Props

  constructor(attrs?: Partial<LayoutProvider.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LayoutProvider"
  }

  abstract get_node_coordinates(graph_source: ColumnarDataSource): [number[], number[]]

  abstract get_edge_coordinates(graph_source: ColumnarDataSource): [[number, number][], [number, number][]]
}
LayoutProvider.initClass()
