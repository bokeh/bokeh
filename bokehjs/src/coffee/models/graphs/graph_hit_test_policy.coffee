import {Model} from "../../model"
import {contains, uniq, findIndex} from "core/util/array"
import {create_hit_test_result, create_1d_hit_test_result} from "core/hittest"
import {Selector} from "core/selector"

export class GraphHitTestPolicy extends Model

  do_selection: (geometry, graph_view, final, append) ->
    return false

  do_inspection: (geometry, graph_view, final, append) ->
    return false


export class NodesOnly extends GraphHitTestPolicy
  type: 'NodesOnly'

  _do: (geometry, graph_view, final, append) ->
    node_view = graph_view.node_view
    hit_test_result = node_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    @_node_selector.update(hit_test_result, final, append)

    return not @_node_selector.indices.is_empty()

  do_selection: (geometry, graph_view, final, append) ->
    @_node_selector = graph_view.node_view.model.data_source.selection_manager.selector
    did_hit = @_do(geometry, graph_view, final, append)
    graph_view.node_view.model.data_source.selected = @_node_selector.indices
    graph_view.node_view.model.data_source.select.emit()
    return did_hit

  do_inspection: (geometry, graph_view, final, append) ->
    @_node_selector = graph_view.model.get_selection_manager().get_or_create_inspector(graph_view.node_view.model)
    did_hit = @_do(geometry, graph_view, final, append)
    graph_view.node_view.model.data_source.inspected = @_node_selector.indices
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {"geometry": geometry}])
    return did_hit


export class NodesAndLinkedEdges extends GraphHitTestPolicy
  type: 'NodesAndLinkedEdges'

  _do: (geometry, graph_view, final, append) ->
    [node_view, edge_view] = [graph_view.node_view, graph_view.edge_view]
    hit_test_result = node_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    @_node_selector.update(hit_test_result, final, append)

    node_indices = (node_view.model.data_source.data.index[i] for i in hit_test_result["1d"].indices)
    edge_source = edge_view.model.data_source
    edge_indices = []
    for i in [0...edge_source.data.start.length]
      if contains(node_indices, edge_source.data.start[i]) or contains(node_indices, edge_source.data.end[i])
        edge_indices.push(i)

    linked_index = create_hit_test_result()
    for i in edge_indices
      linked_index["2d"].indices[i] = [0] #currently only supports 2-element multilines, so this is all of it

    @_edge_selector.update(linked_index, final, append)

    return not @_node_selector.indices.is_empty()

  do_selection: (geometry, graph_view, final, append) ->
    @_node_selector = graph_view.node_view.model.data_source.selection_manager.selector
    @_edge_selector = graph_view.edge_view.model.data_source.selection_manager.selector

    did_hit = @_do(geometry, graph_view, final, append)

    graph_view.node_view.model.data_source.selected = @_node_selector.indices
    graph_view.edge_view.model.data_source.selected = @_edge_selector.indices
    graph_view.node_view.model.data_source.select.emit()

    return did_hit

  do_inspection: (geometry, graph_view, final, append) ->
    @_node_selector = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    @_edge_selector = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)

    did_hit = @_do(geometry, graph_view, final, append)

    graph_view.node_view.model.data_source.inspected = @_node_selector.indices
    graph_view.edge_view.model.data_source.inspected = @_edge_selector.indices
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {"geometry": geometry}])

    return did_hit


export class EdgesAndLinkedNodes extends GraphHitTestPolicy
  type: 'EdgesAndLinkedNodes'

  _do: (geometry, graph_view, final, append) ->
    [node_view, edge_view] = [graph_view.node_view, graph_view.edge_view]
    hit_test_result = edge_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    @_edge_selector.update(hit_test_result, final, append)

    edge_indices = (parseInt(i) for i in Object.keys(hit_test_result['2d'].indices))

    nodes = []
    for i in edge_indices
      nodes.push(edge_view.model.data_source.data.start[i])
      nodes.push(edge_view.model.data_source.data.end[i])

    node_indices = (node_view.model.data_source.data.index.indexOf(i) for i in uniq(nodes))

    node_hit_test_result = create_hit_test_result()
    node_hit_test_result["1d"].indices = node_indices

    @_node_selector.update(node_hit_test_result, final, append)

    return not @_edge_selector.indices.is_empty()

  do_selection: (geometry, graph_view, final, append) ->
    @_edge_selector = graph_view.edge_view.model.data_source.selection_manager.selector
    @_node_selector = graph_view.node_view.model.data_source.selection_manager.selector

    did_hit = @_do(geometry, graph_view, final, append)

    graph_view.edge_view.model.data_source.selected = @_edge_selector.indices
    graph_view.node_view.model.data_source.selected = @_node_selector.indices
    graph_view.edge_view.model.data_source.select.emit()

    return did_hit

  do_inspection: (geometry, graph_view, final, append) ->
    @_edge_selector = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    @_node_selector = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)

    did_hit = @_do(geometry, graph_view, final, append)

    graph_view.edge_view.model.data_source.inspected = @_edge_selector.indices
    graph_view.node_view.model.data_source.inspected = @_node_selector.indices
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view, {'geometry': geometry}])

    return did_hit
