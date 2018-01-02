import {Model} from "../../model"
import {contains, uniq, findIndex} from "core/util/array"
import {create_empty_hit_test_result} from "core/hittest"

export class GraphHitTestPolicy extends Model

  hit_test: (geometry, graph_view) ->
    return null

  do_selection: (geometry, graph_view, final, append) ->
    return false

  do_inspection: (geometry, graph_view, final, append) ->
    return false

  _hit_test_nodes: (geometry, graph_view) ->
    if not graph_view.model.visible
      return null

    hit_test_result = graph_view.node_view.glyph.hit_test(geometry)

    if hit_test_result == null
      return null
    else
      return graph_view.node_view.model.view.convert_selection_from_subset(hit_test_result)

  _hit_test_edges: (geometry, graph_view) ->
    if not graph_view.model.visible
      return null

    hit_test_result = graph_view.edge_view.glyph.hit_test(geometry)

    if hit_test_result == null
      return null
    else
      return graph_view.edge_view.model.view.convert_selection_from_subset(hit_test_result)


export class NodesOnly extends GraphHitTestPolicy
  type: 'NodesOnly'

  hit_test: (geometry, graph_view) ->
    return @_hit_test_nodes(geometry, graph_view)

  do_selection: (hit_test_result, graph_view, final, append) ->
    node_selection = graph_view.node_view.model.data_source.selected
    node_selection.update(hit_test_result, final, append)
    graph_view.node_view.model.data_source.select.emit()

    return not node_selection.is_empty()

  do_inspection: (hit_test_result, geometry, graph_view, final, append) ->
    node_inspection = graph_view.model.get_selection_manager().get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, append)

    # silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {geometry: geometry}])

    return not node_selection.is_empty()


export class NodesAndLinkedEdges extends GraphHitTestPolicy
  type: 'NodesAndLinkedEdges'

  hit_test: (geometry, graph_view) ->
    return @_hit_test_nodes(geometry, graph_view)

  get_linked_edges: (node_source, edge_source) ->
    node_indices = (node_source.data.index[i] for i in node_source.selected.indices)
    edge_indices = []
    for i in [0...edge_source.data.start.length]
      if contains(node_indices, edge_source.data.start[i]) or contains(node_indices, edge_source.data.end[i])
        edge_indices.push(i)

    linked_edges = create_empty_hit_test_result()
    for i in edge_indices
      linked_edges["2d"].indices[i] = [0] #currently only supports 2-element multilines, so this is all of it
    linked_edges.indices = edge_indices

    return linked_edges

  do_selection: (hit_test_result, graph_view, final, append) ->
    if hit_test_result == null
      return false

    node_selection = graph_view.node_view.model.data_source.selected
    node_selection.update(hit_test_result, final, append)

    edge_selection = graph_view.edge_view.model.data_source.selected
    linked_edges_selection = @get_linked_edges(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source)
    edge_selection.update(linked_edges_selection, final, append)

    graph_view.node_view.model.data_source.select.emit()

    return not node_selection.is_empty()

  do_inspection: (hit_test_result, geometry, graph_view, final, append) ->
    if hit_test_result == null
      return false

    node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, append)

    edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    linked_edges = @get_linked_edges(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source)
    edge_inspection.update(linked_edges, final, append)

    # silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {geometry: geometry}])

    return not node_inspection.is_empty()


export class EdgesAndLinkedNodes extends GraphHitTestPolicy
  type: 'EdgesAndLinkedNodes'

  hit_test: (geometry, graph_view) ->
    return @_hit_test_edges(geometry, graph_view)

  get_linked_nodes: (node_source, edge_source) ->
    edge_indices = edge_source.selected.indices
    nodes = []
    for i in edge_indices
      nodes.push(edge_source.data.start[i])
      nodes.push(edge_source.data.end[i])

    node_indices = (node_source.data.index.indexOf(i) for i in uniq(nodes))

    linked_nodes = create_empty_hit_test_result()
    linked_nodes.indices = node_indices
    return linked_nodes

  do_selection: (hit_test_result, graph_view, final, append) ->
    if hit_test_result == null
      return false

    edge_selection = graph_view.edge_view.model.data_source.selected
    edge_selection.update(hit_test_result, final, append)

    node_selection = graph_view.node_view.model.data_source.selected
    linked_nodes = @get_linked_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source)
    node_selection.update(linked_nodes, final, append)

    graph_view.edge_view.model.data_source.select.emit()

    return not edge_selection.is_empty()

  do_inspection: (hit_test_result, geometry, graph_view, final, append) ->
    if hit_test_result == null
      return false

    edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    edge_inspection.update(hit_test_result, final, append)

    node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    linked_nodes = @get_linked_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source)
    node_inspection.update(linked_nodes, final, append)

    # silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view, {geometry: geometry}])

    return not edge_inspection.is_empty()
