import {Model} from "../../model"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace LayoutProvider {
  export interface Attrs extends Model.Attrs {}

  export interface Opts extends Model.Opts {}
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {

  constructor(attrs?: Partial<LayoutProvider.Attrs>, opts?: LayoutProvider.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "LayoutProvider"
  }

  abstract get_node_coordinates(graph_source: ColumnarDataSource): [number[], number[]]

  abstract get_edge_coordinates(graph_source: ColumnarDataSource): [[number, number][], [number, number][]]
}
LayoutProvider.initClass()
