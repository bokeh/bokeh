import {LayoutProvider} from "./layout_provider"

export class StaticLayoutProvider extends LayoutProvider
  type: "StaticLayoutProvider"

  get_node_locations: (x, y) ->
    return [x, y]

  get_edge_locations: (x, y) ->
    return [x, y]
