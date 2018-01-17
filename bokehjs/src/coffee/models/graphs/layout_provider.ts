/* XXX: partial */
import {Model} from "../../model"

export class LayoutProvider extends Model {

  get_node_coordinates(_graph_source) {
    // this is implemented by base classes
    return [[], []];
  }

  get_edge_coordinates(_graph_source) {
    // this is implemented by base classes
    return [[], []];
  }
}
