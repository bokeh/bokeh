import {Model} from "../../model"
import {contains, uniq} from "core/util/array"
import {create_empty_hit_test_result, HitTestResult} from "core/hittest"
import {Geometry} from "core/geometry"
import {Selection} from "models/selections/selection"

// XXX: temporary types
export type GraphRendererView = any
export type DataSource = any

export abstract class GraphHitTestPolicy extends Model {

  abstract hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult

  abstract do_selection(hit_test_result: HitTestResult, graph_view: GraphRendererView, final: boolean, append: boolean): boolean

  abstract do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, append: boolean): boolean

  _hit_test_nodes(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    if(!graph_view.model.visible)
      return null

    const hit_test_result = graph_view.node_view.glyph.hit_test(geometry)

    if(hit_test_result == null)
      return null
    else
      return graph_view.node_view.model.view.convert_selection_from_subset(hit_test_result)
  }

  _hit_test_edges(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    if(!graph_view.model.visible)
      return null

    const hit_test_result = graph_view.edge_view.glyph.hit_test(geometry)

    if(hit_test_result == null)
      return null
    else
      return graph_view.edge_view.model.view.convert_selection_from_subset(hit_test_result)
  }
}

GraphHitTestPolicy.prototype.type = "GraphHitTestPolicy"

export class NodesOnly extends GraphHitTestPolicy {

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test_nodes(geometry, graph_view)
  }

  do_selection(hit_test_result: HitTestResult, graph_view: GraphRendererView, final: boolean, append: boolean): boolean {
    if(hit_test_result == null)
      return false

    const node_selection = graph_view.node_view.model.data_source.selected
    node_selection.update(hit_test_result, final, append)
    graph_view.node_view.model.data_source.select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, append: boolean): boolean {
    if(hit_test_result == null)
      return false

    const node_inspection = graph_view.model.get_selection_manager().get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, append)

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {geometry: geometry}])

    return !node_inspection.is_empty()
  }
}

NodesOnly.prototype.type = "NodesOnly"

export class NodesAndLinkedEdges extends GraphHitTestPolicy {

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test_nodes(geometry, graph_view)
  }

  get_linked_edges(node_source: DataSource, edge_source: DataSource, mode: string): Selection {
    let node_indices
    if(mode == 'selection'){
      node_indices = node_source.selected.indices.map(i => node_source.data.index[i])
    }else if (mode == 'inspection'){
      node_indices = node_source.inspected.indices.map(i => node_source.data.index[i])
    }
    const edge_indices = []
    for(let i = 0; i < edge_source.data.start.length; i++){
      if(contains(node_indices, edge_source.data.start[i]) || contains(node_indices, edge_source.data.end[i]))
        edge_indices.push(i)
    }

    const linked_edges = create_empty_hit_test_result()
    for (const i of edge_indices){
      linked_edges["2d"].indices[i] = [0] //currently only supports 2-element multilines, so this is all of it
    }
    linked_edges.indices = edge_indices

    return linked_edges
  }

  do_selection(hit_test_result: HitTestResult, graph_view: GraphRendererView, final: boolean, append: boolean): boolean {
    if(hit_test_result == null)
      return false

    const node_selection = graph_view.node_view.model.data_source.selected
    node_selection.update(hit_test_result, final, append)

    const edge_selection = graph_view.edge_view.model.data_source.selected
    const linked_edges_selection = this.get_linked_edges(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, 'selection')
    edge_selection.update(linked_edges_selection, final, append)

    graph_view.node_view.model.data_source.select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, append: boolean): boolean {
    if(hit_test_result == null)
      return false

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, append)
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})

    const edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    const linked_edges = this.get_linked_edges(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, 'inspection')
    edge_inspection.update(linked_edges, final, append)

    //silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view, {geometry: geometry}])

    return !node_inspection.is_empty()
  }
}

NodesAndLinkedEdges.prototype.type = 'NodesAndLinkedEdges'

export class EdgesAndLinkedNodes extends GraphHitTestPolicy {

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test_edges(geometry, graph_view)
  }

  get_linked_nodes(node_source: DataSource, edge_source: DataSource, mode: string): Selection {
    let edge_indices
    if(mode == 'selection')
      edge_indices = edge_source.selected.indices
    else if (mode == 'inspection')
      edge_indices = edge_source.inspected.indices
    const nodes = []
    for(const i of edge_indices){
      nodes.push(edge_source.data.start[i])
      nodes.push(edge_source.data.end[i])
    }

    const node_indices = uniq(nodes).map(i => node_source.data.index.indexOf(i))
    const linked_nodes = create_empty_hit_test_result()
    linked_nodes.indices = node_indices
    return linked_nodes
  }

  do_selection(hit_test_result: HitTestResult, graph_view: GraphRendererView, final: boolean, append: boolean): boolean {
    if(hit_test_result == null)
      return false

    const edge_selection = graph_view.edge_view.model.data_source.selected
    edge_selection.update(hit_test_result, final, append)

    const node_selection = graph_view.node_view.model.data_source.selected
    const linked_nodes = this.get_linked_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, 'selection')
    node_selection.update(linked_nodes, final, append)

    graph_view.edge_view.model.data_source.select.emit()

    return !edge_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, append: boolean): boolean {
    if(hit_test_result == null)
      return false

    const edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    edge_inspection.update(hit_test_result, final, append)
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    const linked_nodes = this.get_linked_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, 'inspection')
    node_inspection.update(linked_nodes, final, append)

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view, {geometry: geometry}])

    return !edge_inspection.is_empty()
  }
}

EdgesAndLinkedNodes.prototype.type = 'EdgesAndLinkedNodes'
