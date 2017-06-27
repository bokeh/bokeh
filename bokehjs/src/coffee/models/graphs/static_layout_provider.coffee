import {LayoutProvider} from "./layout_provider"
import * as p from "../../core/properties"

export class StaticLayoutProvider extends LayoutProvider
  type: "StaticLayoutProvider"

  get_node_coordinates: (graph_source) ->
    [x, y] = [[], []]
    for i in graph_source.nodes.data.index
      x.push(@graph_layout[i]?[0] | null)
      y.push(@graph_layout[i]?[1] | null)
    return [x, y]

  get_edge_coordinates: (graph_source) ->
    edges = graph_source.edges.data
    [xs, ys] = [[], []]
    for i in [0...edges.start.length]
      xs.push([@graph_layout[edges.start[i]][0], @graph_layout[edges.end[i]][0]])
      ys.push([@graph_layout[edges.start[i]][1], @graph_layout[edges.end[i]][1]])
    return [xs, ys]

  @define {
    graph_layout: [ p.Any, {} ]
  }
