import {Model} from "../../model"
import {indexOf} from "core/util/arrayable"
import {contains, uniq} from "core/util/array"
import {HitTestResult} from "core/hittest"
import {Geometry} from "core/geometry"
import {SelectionMode} from "core/enums"
import * as p from "core/properties"
import {Selection} from "../selections/selection"
import {GraphRenderer, GraphRendererView} from "../renderers/graph_renderer"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace GraphHitTestPolicy {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface GraphHitTestPolicy extends Model.Attrs {}

export abstract class GraphHitTestPolicy extends Model {
  properties: GraphHitTestPolicy.Props

  constructor(attrs?: Partial<GraphHitTestPolicy.Attrs>) {
    super(attrs)
  }

  abstract hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult

  abstract do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean

  abstract do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean

  _hit_test_nodes(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    if (!graph_view.model.visible)
      return null

    const hit_test_result = graph_view.node_view.glyph.hit_test(geometry)

    if (hit_test_result == null)
      return null
    else
      return graph_view.node_view.model.view.convert_selection_from_subset(hit_test_result)
  }

  _hit_test_edges(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    if (!graph_view.model.visible)
      return null

    const hit_test_result = graph_view.edge_view.glyph.hit_test(geometry)

    if (hit_test_result == null)
      return null
    else
      return graph_view.edge_view.model.view.convert_selection_from_subset(hit_test_result)
  }
}

export namespace NodesOnly {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GraphHitTestPolicy.Props
}

export interface NodesOnly extends NodesOnly.Attrs {}

export class NodesOnly extends GraphHitTestPolicy {
  properties: NodesOnly.Props

  constructor(attrs?: Partial<NodesOnly.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test_nodes(geometry, graph_view)
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null)
      return false

    const node_selection = graph.node_renderer.data_source.selected
    node_selection.update(hit_test_result, final, mode)
    graph.node_renderer.data_source._select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null)
      return false

    const node_inspection = graph_view.model.get_selection_manager().get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, mode)

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view.model, {geometry}])

    return !node_inspection.is_empty()
  }
}

export namespace NodesAndLinkedEdges {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GraphHitTestPolicy.Props
}

export interface NodesAndLinkedEdges extends NodesAndLinkedEdges.Attrs {}

export class NodesAndLinkedEdges extends GraphHitTestPolicy {
  properties: NodesAndLinkedEdges.Props

  constructor(attrs?: Partial<NodesAndLinkedEdges.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test_nodes(geometry, graph_view)
  }

  get_linked_edges(node_source: ColumnarDataSource, edge_source: ColumnarDataSource, mode: string): Selection {
    let node_indices = []
    if (mode == 'selection'){
      node_indices = node_source.selected.indices.map((i: number) => node_source.data.index[i])
    } else if (mode == 'inspection'){
      node_indices = node_source.inspected.indices.map((i: number) => node_source.data.index[i])
    }
    const edge_indices = []
    for (let i = 0; i < edge_source.data.start.length; i++){
      if (contains(node_indices, edge_source.data.start[i]) || contains(node_indices, edge_source.data.end[i]))
        edge_indices.push(i)
    }

    const linked_edges = new Selection()
    for (const i of edge_indices) {
      linked_edges.multiline_indices[i] = [0] //currently only supports 2-element multilines, so this is all of it
    }
    linked_edges.indices = edge_indices

    return linked_edges
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null)
      return false

    const node_selection = graph.node_renderer.data_source.selected
    node_selection.update(hit_test_result, final, mode)

    const edge_selection = graph.edge_renderer.data_source.selected
    const linked_edges_selection = this.get_linked_edges(graph.node_renderer.data_source, graph.edge_renderer.data_source, 'selection')
    edge_selection.update(linked_edges_selection, final, mode)

    graph.node_renderer.data_source._select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null)
      return false

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, mode)
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})

    const edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    const linked_edges = this.get_linked_edges(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, 'inspection')
    edge_inspection.update(linked_edges, final, mode)

    //silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})
    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view.model, {geometry}])

    return !node_inspection.is_empty()
  }
}

export namespace EdgesAndLinkedNodes {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GraphHitTestPolicy.Props
}

export interface EdgesAndLinkedNodes extends EdgesAndLinkedNodes.Attrs {}

export class EdgesAndLinkedNodes extends GraphHitTestPolicy {
  properties: EdgesAndLinkedNodes.Props

  constructor(attrs?: Partial<EdgesAndLinkedNodes.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test_edges(geometry, graph_view)
  }

  get_linked_nodes(node_source: ColumnarDataSource, edge_source: ColumnarDataSource, mode: string): Selection {
    let edge_indices: number[] = []
    if (mode == 'selection')
      edge_indices = edge_source.selected.indices
    else if (mode == 'inspection')
      edge_indices = edge_source.inspected.indices
    const nodes = []
    for (const i of edge_indices){
      nodes.push(edge_source.data.start[i])
      nodes.push(edge_source.data.end[i])
    }

    const node_indices = uniq(nodes).map((i) => indexOf(node_source.data.index, i))
    return new Selection({indices: node_indices})
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null)
      return false

    const edge_selection = graph.edge_renderer.data_source.selected
    edge_selection.update(hit_test_result, final, mode)

    const node_selection = graph.node_renderer.data_source.selected
    const linked_nodes = this.get_linked_nodes(graph.node_renderer.data_source, graph.edge_renderer.data_source, 'selection')
    node_selection.update(linked_nodes, final, mode)

    graph.edge_renderer.data_source._select.emit()

    return !edge_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null)
      return false

    const edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    edge_inspection.update(hit_test_result, final, mode)
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    const linked_nodes = this.get_linked_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, 'inspection')
    node_inspection.update(linked_nodes, final, mode)

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view.model, {geometry}])

    return !edge_inspection.is_empty()
  }
}
