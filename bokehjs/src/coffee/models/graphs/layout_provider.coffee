import {Model} from "../../model"

export class LayoutProvider extends Model

  get_node_coordinates: (graph_source) ->
    # this is implemented by base classes
    return [[], []]

  get_edge_coordinates: (graph_source) ->
    # this is implemented by base classes
    return [[], []]
