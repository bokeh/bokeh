import {LayoutProvider} from "./layout_provider"
import * as p from "../../core/properties"

export class StaticLayoutProvider extends LayoutProvider
  type: "StaticLayoutProvider"

  get_node_coordinates: (node_source) ->
    [xs, ys] = [[], []]
    for i in node_source.data.index
      x = if @graph_layout[i]? then @graph_layout[i][0] else NaN
      y = if @graph_layout[i]? then @graph_layout[i][1] else NaN
      xs.push(x)
      ys.push(y)
    return [xs, ys]

  get_edge_coordinates: (edge_source) ->
    [xs, ys] = [[], []]
    starts = edge_source.data.start
    ends = edge_source.data.end
    for i in [0...starts.length]
      if @graph_layout[starts[i]]? and @graph_layout[ends[i]]?
        [start, end] = [@graph_layout[starts[i]], @graph_layout[ends[i]]]
      else
        [start, end] = [[NaN, NaN], [NaN, NaN]]
      xs.push([start[0], end[0]])
      ys.push([start[1], end[1]])
    return [xs, ys]

  @define {
    graph_layout: [ p.Any, {} ]
  }
