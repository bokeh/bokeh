import {Model} from "../../model"

export class LayoutProvider extends Model

  get_node_locations: (graph_source) ->
    # this is implemented by base classes
    return [[], []]

  get_edge_locations: (graph_source) ->
    # this is implemented by base classes
    return [[], []]
