/* XXX: partial */
import {Model} from "../../model"

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

  get_node_coordinates(_graph_source) {
    // this is implemented by base classes
    return [[], []];
  }

  get_edge_coordinates(_graph_source) {
    // this is implemented by base classes
    return [[], []];
  }
}
LayoutProvider.initClass()
