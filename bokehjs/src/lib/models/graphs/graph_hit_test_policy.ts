import {Model} from "../../model"
import {index_of, map} from "core/util/arrayable"
import {contains, uniq} from "core/util/array"
import {dict} from "core/util/object"
import type {HitTestResult} from "core/hittest"
import type {Geometry} from "core/geometry"
import type {SelectionMode} from "core/enums"
import type * as p from "core/properties"
import {Selection} from "../selections/selection"
import type {GraphRenderer, GraphRendererView} from "../renderers/graph_renderer"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {GlyphRendererView} from "../renderers/glyph_renderer"

type IndicesType = "selection" | "inspection"

export namespace GraphHitTestPolicy {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface GraphHitTestPolicy extends Model.Attrs {}

export abstract class GraphHitTestPolicy extends Model {
  declare properties: GraphHitTestPolicy.Props

  constructor(attrs?: Partial<GraphHitTestPolicy.Attrs>) {
    super(attrs)
  }

  abstract hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult

  abstract do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean

  abstract do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean

  protected _hit_test(geometry: Geometry, graph_view: GraphRendererView, renderer_view: GlyphRendererView): HitTestResult {
    if (!graph_view.model.visible) {
      return null
    }

    const hit_test_result = renderer_view.glyph.hit_test(geometry)

    if (hit_test_result == null) {
      return null
    } else {
      return renderer_view.model.view.convert_selection_from_subset(hit_test_result)
    }
  }
}

export namespace EdgesOnly {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GraphHitTestPolicy.Props
}

export interface EdgesOnly extends EdgesOnly.Attrs {}

export class EdgesOnly extends GraphHitTestPolicy {
  declare properties: EdgesOnly.Props

  constructor(attrs?: Partial<EdgesOnly.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test(geometry, graph_view, graph_view.edge_view)
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const edge_selection = graph.edge_renderer.data_source.selected
    edge_selection.update(hit_test_result, final, mode)
    graph.edge_renderer.data_source._select.emit()

    return !edge_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const {edge_renderer} = graph_view.model
    const edge_inspection = edge_renderer.get_selection_manager().get_or_create_inspector(graph_view.edge_view.model)
    edge_inspection.update(hit_test_result, final, mode)

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view.model, {geometry}])

    return !edge_inspection.is_empty()
  }
}

export namespace NodesOnly {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GraphHitTestPolicy.Props
}

export interface NodesOnly extends NodesOnly.Attrs {}

export class NodesOnly extends GraphHitTestPolicy {
  declare properties: NodesOnly.Props

  constructor(attrs?: Partial<NodesOnly.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test(geometry, graph_view, graph_view.node_view)
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const node_selection = graph.node_renderer.data_source.selected
    node_selection.update(hit_test_result, final, mode)
    graph.node_renderer.data_source._select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const  {node_renderer} = graph_view.model
    const node_inspection = node_renderer.get_selection_manager().get_or_create_inspector(graph_view.node_view.model)
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
  declare properties: NodesAndLinkedEdges.Props

  constructor(attrs?: Partial<NodesAndLinkedEdges.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test(geometry, graph_view, graph_view.node_view)
  }

  get_linked_edges(node_source: ColumnarDataSource, edge_source: ColumnarDataSource, mode: IndicesType): Selection {
    const node_data = dict(node_source.data)
    const index = node_data.get("index") ?? []

    const node_indices = (() => {
      switch (mode) {
        case "selection":  return map(node_source.selected.indices, (i) => index[i])
        case "inspection": return map(node_source.inspected.indices, (i) => index[i])
      }
    })()

    const edge_data = dict(edge_source.data)
    const start = edge_data.get("start") ?? []
    const end = edge_data.get("end") ?? []

    const edge_indices = []
    const n = start.length
    for (let i = 0; i < n; i++) {
      if (contains(node_indices, start[i]) || contains(node_indices, end[i])) {
        edge_indices.push(i)
      }
    }

    const linked_edges = new Selection()
    for (const i of edge_indices) {
      linked_edges.multiline_indices.set(i, [0]) //currently only supports 2-element multilines, so this is all of it
    }
    linked_edges.indices = edge_indices

    return linked_edges
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const node_selection = graph.node_renderer.data_source.selected
    node_selection.update(hit_test_result, final, mode)

    const edge_selection = graph.edge_renderer.data_source.selected
    const linked_edges_selection = this.get_linked_edges(graph.node_renderer.data_source, graph.edge_renderer.data_source, "selection")
    edge_selection.update(linked_edges_selection, final, mode)

    graph.node_renderer.data_source._select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, mode)
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})

    const edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    const linked_edges = this.get_linked_edges(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, "inspection")
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
  declare properties: EdgesAndLinkedNodes.Props

  constructor(attrs?: Partial<EdgesAndLinkedNodes.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test(geometry, graph_view, graph_view.edge_view)
  }

  get_linked_nodes(node_source: ColumnarDataSource, edge_source: ColumnarDataSource, mode: IndicesType): Selection {
    const edge_indices = (() => {
      switch (mode) {
        case "selection":  return edge_source.selected.indices
        case "inspection": return edge_source.inspected.indices
      }
    })()

    const edge_data = dict(edge_source.data)
    const start = edge_data.get("start") ?? []
    const end = edge_data.get("end") ?? []

    const nodes = []
    for (const i of edge_indices) {
      nodes.push(start[i], end[i])
    }

    const node_data = dict(node_source.data)
    const index = node_data.get("index") ?? []
    const node_indices = uniq(nodes).map((i) => index_of(index, i))
    return new Selection({indices: node_indices})
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const edge_selection = graph.edge_renderer.data_source.selected
    edge_selection.update(hit_test_result, final, mode)

    const node_selection = graph.node_renderer.data_source.selected
    const linked_nodes = this.get_linked_nodes(graph.node_renderer.data_source, graph.edge_renderer.data_source, "selection")
    node_selection.update(linked_nodes, final, mode)

    graph.edge_renderer.data_source._select.emit()

    return !edge_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const edge_inspection = graph_view.edge_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.edge_view.model)
    edge_inspection.update(hit_test_result, final, mode)
    graph_view.edge_view.model.data_source.setv({inspected: edge_inspection}, {silent: true})

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    const linked_nodes = this.get_linked_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, "inspection")
    node_inspection.update(linked_nodes, final, mode)

    // silently set inspected attr to avoid triggering data_source.change event and rerender
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    graph_view.edge_view.model.data_source.inspect.emit([graph_view.edge_view.model, {geometry}])

    return !edge_inspection.is_empty()
  }
}

export namespace NodesAndAdjacentNodes {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GraphHitTestPolicy.Props
}

export interface NodesAndAdjacentNodes extends NodesAndAdjacentNodes.Attrs {}

export class NodesAndAdjacentNodes extends GraphHitTestPolicy {
  declare properties: NodesAndAdjacentNodes.Props

  constructor(attrs?: Partial<NodesAndAdjacentNodes.Attrs>) {
    super(attrs)
  }

  hit_test(geometry: Geometry, graph_view: GraphRendererView): HitTestResult {
    return this._hit_test(geometry, graph_view, graph_view.node_view)
  }

  get_adjacent_nodes(node_source: ColumnarDataSource, edge_source: ColumnarDataSource, mode: IndicesType): Selection {
    const node_data = dict(node_source.data)
    const index = node_data.get("index") ?? []

    const selected_node_indices = (() => {
      switch (mode) {
        case "selection":  return map(node_source.selected.indices, (i) => index[i])
        case "inspection": return map(node_source.inspected.indices, (i) => index[i])
      }
    })()

    const edge_data = dict(edge_source.data)
    const start = edge_data.get("start") ?? []
    const end = edge_data.get("end") ?? []

    const adjacent_nodes = []
    const selected_nodes = []
    for (let i = 0; i < start.length; i++) {
      if (contains(selected_node_indices, start[i])) {
        adjacent_nodes.push(end[i])
        selected_nodes.push(start[i])
      }
      if (contains(selected_node_indices, end[i])) {
        adjacent_nodes.push(start[i])
        selected_nodes.push(end[i])
      }
    }
    for (let i = 0; i < selected_nodes.length; i++) {
      adjacent_nodes.push(selected_nodes[i])
    }

    const adjacent_node_indices = uniq(adjacent_nodes).map((i) => index_of(index, i))
    return new Selection({indices: adjacent_node_indices})
  }

  do_selection(hit_test_result: HitTestResult, graph: GraphRenderer, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const node_selection = graph.node_renderer.data_source.selected
    node_selection.update(hit_test_result, final, mode)

    const adjacent_nodes_selection = this.get_adjacent_nodes(graph.node_renderer.data_source, graph.edge_renderer.data_source, "selection")
    if (!adjacent_nodes_selection.is_empty()) {
      node_selection.update(adjacent_nodes_selection, final, mode)
    }

    graph.node_renderer.data_source._select.emit()

    return !node_selection.is_empty()
  }

  do_inspection(hit_test_result: HitTestResult, geometry: Geometry, graph_view: GraphRendererView, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    }

    const node_inspection = graph_view.node_view.model.data_source.selection_manager.get_or_create_inspector(graph_view.node_view.model)
    node_inspection.update(hit_test_result, final, mode)
    graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})

    const adjacent_nodes_inspection = this.get_adjacent_nodes(graph_view.node_view.model.data_source, graph_view.edge_view.model.data_source, "inspection")
    if (!adjacent_nodes_inspection.is_empty()) {
      node_inspection.update(adjacent_nodes_inspection, final, mode)
      graph_view.node_view.model.data_source.setv({inspected: node_inspection}, {silent: true})
    }

    graph_view.node_view.model.data_source.inspect.emit([graph_view.node_view.model, {geometry}])
    return !node_inspection.is_empty()
  }
}
