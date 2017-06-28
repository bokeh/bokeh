import {LayoutProvider} from "./layout_provider"
import * as p from "../../core/properties"

export class StaticLayoutProvider extends LayoutProvider
  type: "StaticLayoutProvider"

  get_node_coordinates: (graph_source) ->
    [xs, ys] = [[], []]
    for i in graph_source.nodes.data.index
      x = if @graph_layout[i]? then @graph_layout[i][0] else null
      y = if @graph_layout[i]? then @graph_layout[i][1] else null
      xs.push(x)
      ys.push(y)
    return [xs, ys]

  get_edge_coordinates: (graph_source) ->
    [xs, ys] = [[], []]
    starts = graph_source.edges.data.start
    ends = graph_source.edges.data.end
    for i in [0...starts.length]
      start = if @graph_layout[starts[i]]? then @graph_layout[starts[i]] else [null, null]
      end = if @graph_layout[ends[i]]? then @graph_layout[ends[i]] else [null, null]
      xs.push([start[0], end[0]])
      ys.push([start[1], end[1]])
    return [xs, ys]

  @define {
    graph_layout: [ p.Any, {} ]
  }
