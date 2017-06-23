import {Model} from "../../model"

export class LayoutProvider extends Model

  get_node_locations: (x, y) ->
    return [x, y]

  get_edge_locations: (x, y) ->
    return [x, y]
