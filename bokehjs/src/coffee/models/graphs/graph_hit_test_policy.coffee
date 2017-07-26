import {Model} from "../../model"
import {contains} from "core/util/array"
import {create_hit_test_result} from "core/hittest"

export class GraphHitTestPolicy extends Model

  initialize: (options) ->
    super(options)

  do_selection: (geometry, graph_view, final, append) ->
    return false

  do_inspection: (geometry, graph_view, final, append) ->
    return false


export class NodesOnly extends Model

  do_selection: (geometry, graph_view, final, append) ->
    node_view = graph_view.node_view
    hit_test_result = node_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    indices = node_view.model.view.convert_selection_from_subset(hit_test_result)

    selector = node_view.model.data_source.selection_manager.selector
    selector.update(indices, final, append)
    node_view.model.data_source.selected = selector.indices

    return not indices.is_empty()

  do_inspection: (geometry, graph_view, final, append) ->
    node_view = graph_view.node_view
    hit_test_result = node_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    indices = hit_test_result

    inspector = node_view.model.data_source.selection_manager.inspectors[graph_view.model.id]
    inspector.update(indices, true, false, true)
    node_view.model.data_source.inspected = inspector.indices

    return not indices.is_empty()


export class NodesAndLinkedEdges extends Model

  do_selection: (geometry, graph_view, final, append) ->
    [node_view, edge_view] = [graph_view.node_view, graph_view.edge_view]
    hit_test_result = node_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    indices = node_view.model.view.convert_selection_from_subset(hit_test_result)

    selector = node_view.model.data_source.selection_manager.selector
    selector.update(indices, final, append)
    node_view.model.data_source.selected = selector.indices

    node_indices = (node_view.model.data_source.data.index[i] for i in indices["1d"].indices)
    edge_source = edge_view.model.data_source
    edge_indices = []
    for i in [0...edge_source.data.start.length]
      if contains(node_indices, edge_source.data.start[i]) or contains(node_indices, edge_source.data.end[i])
        edge_indices.push(i)

    linked_index = create_hit_test_result()
    for i in edge_indices
      linked_index["2d"].indices[i] = [0] #currently only supports 2-element multilines, so this is all of it

    edge_selector = edge_view.model.data_source.selection_manager.selector
    edge_selector.update(linked_index, final, append)
    edge_view.model.data_source.selected = edge_selector.indices
    edge_view.model.data_source.select.emit()

    return not indices.is_empty()


  do_inspection: (geometry, graph_view, final, append) ->
    [node_view, edge_view] = [graph_view.node_view, graph_view.edge_view]

    hit_test_result = node_view.glyph.hit_test(geometry)

    # glyphs that don't have hit-testing implemented will return null
    if hit_test_result == null
      return false

    indices = hit_test_result

    inspector = node_view.model.data_source.selection_manager.inspectors[graph_view.model.id]
    inspector.update(indices, true, false, true)
    node_view.model.data_source.inspected = inspector.indices

    node_indices = (node_view.model.data_source.data.index[i] for i in indices["1d"].indices)
    edge_source = edge_view.model.data_source
    edge_indices = []
    for i in [0...edge_source.data.start.length]
      if contains(node_indices, edge_source.data.start[i]) or contains(node_indices, edge_source.data.end[i])
        edge_indices.push(i)

    linked_index = create_hit_test_result()
    for i in edge_indices
      linked_index["2d"].indices[i] = [0] #currently only supports 2-element multilines, so this is all of it

    # manually get or create inspector
    edge_view.model.data_source.selection_manager._set_inspector(edge_view.model)
    edge_inspector = edge_view.model.data_source.selection_manager.inspectors[edge_view.model.id]
    edge_inspector.update(linked_index, final, append)
    edge_view.model.data_source.inspected = edge_inspector.indices
    edge_view.model.data_source.inspect.emit()

    return not indices.is_empty()
