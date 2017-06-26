import {LayoutProvider} from "./layout_provider"
import * as p from "../../core/properties"

export class StaticLayoutProvider extends LayoutProvider
  type: "StaticLayoutProvider"

  get_node_locations: (graph_source) ->
    [x, y] = [[], []]
    for i in graph_source.nodes.data.index
      x.push(@layout[i][0] ? null)
      y.push(@layout[i][1] ? null)
    return [x, y]

  get_edge_locations: (graph_source) ->
    return @layout

  @define {
    layout: [ p.Any, {} ]
  }
