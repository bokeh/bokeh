import type {Geometry} from "./geometry"
import type {SelectionMode} from "core/enums"
import {Selection} from "models/selections/selection"
import type {DataSource} from "models/sources/data_source"
import type {GraphDataSource} from "models/sources/graph_data_source"
import type {IndexedDataSource} from "models/sources/indexed_data_source"
import type {GraphSelections} from "models/selections/interaction_policy"
import type {DataRenderer, DataRendererView} from "models/renderers/data_renderer"
import type {GlyphRendererView} from "models/renderers/glyph_renderer"
import type {GraphRendererView} from "models/renderers/graph_renderer"

// XXX: this is needed to cut circular dependency between this, models/renderers/* and models/sources/*
function is_GlyphRendererView(renderer_view: DataRendererView): renderer_view is GlyphRendererView {
  return renderer_view.model.type == "GlyphRenderer"
}
function is_GraphRendererView(renderer_view: DataRendererView): renderer_view is GraphRendererView {
  return renderer_view.model.type == "GraphRenderer"
}

export type SelectionState = Selection | {nodes: Selection, edges: Selection}

export abstract class SelectionManager {
  constructor(readonly source: DataSource) {}

  inspectors: Map<DataRenderer, Selection> = new Map()

  abstract select(renderer_views: DataRendererView[], geometry: Geometry, final: boolean, mode?: SelectionMode): boolean
  abstract inspect(renderer_view: DataRendererView, geometry: Geometry): boolean
  abstract invert(rview?: DataRendererView): void
  abstract clear(rview?: DataRendererView): void
  abstract get_selection(): SelectionState
  abstract update_selection(selection: SelectionState): void

  get_or_create_inspector(renderer: DataRenderer): Selection {
    let selection = this.inspectors.get(renderer)
    if (selection == null) {
      selection = Selection.create()
      this.inspectors.set(renderer, selection)
    }
    return selection
  }
}

export class IndexedSelectionManager extends SelectionManager {
  declare readonly source: IndexedDataSource

  constructor(source: IndexedDataSource) {
    super(source)
  }

  select(renderer_views: DataRendererView[], geometry: Geometry, final: boolean, mode: SelectionMode = "replace"): boolean {
    const glyph_renderer_views: GlyphRendererView[] = []
    for (const r of renderer_views) {
      if (is_GlyphRendererView(r)) {
        glyph_renderer_views.push(r)
      }
    }

    if (glyph_renderer_views.length == 0) {
      return false
    }

    const hit_test_result = this.source.selection_policy.hit_test(geometry, glyph_renderer_views)
    return this.source.selection_policy.do_selection(hit_test_result, this.source, final, mode)
  }

  inspect(renderer_view: DataRendererView, geometry: Geometry): boolean {
    let did_hit = false

    if (is_GlyphRendererView(renderer_view)) {
      const hit_test_result = renderer_view.hit_test(geometry)
      if (hit_test_result != null) {
        did_hit = !hit_test_result.is_empty()
        const inspection = this.get_or_create_inspector(renderer_view.model)
        inspection.update(hit_test_result, true, "replace")
        this.source.setv({inspected: inspection}, {silent: true})
        this.source.inspect.emit([renderer_view.model, {geometry}])
      }
    }

    return did_hit
  }

  invert(rview?: DataRendererView): void {
    const n = this.source.get_length()
    if (n == null) {
      return
    }
    this.source.selected.invert(n)
    if (rview != null) {
      this.get_or_create_inspector(rview.model).invert(n)
    }
  }

  clear(rview?: DataRendererView): void {
    this.source.selected.clear()
    if (rview != null) {
      this.get_or_create_inspector(rview.model).clear()
    }
  }

  get_selection(): Selection {
    return this.source.selected
  }

  update_selection(selection: SelectionState): void {
    if (selection instanceof Selection) {
      this.source.selected.update(selection, true)
    }
  }

}

export class GraphSelectionManager extends SelectionManager {
  declare readonly source: GraphDataSource

  constructor(source: GraphDataSource) {
    super(source)
  }

  private _select({nodes, edges}: GraphSelections, final: boolean, mode: SelectionMode): void {
    this.source.nodes.selected.update(nodes, final, mode)
    this.source.nodes._select.emit()
    this.source.edges.selected.update(edges, final, mode)
    this.source.edges._select.emit()
  }

  select(renderer_views: DataRendererView[], geometry: Geometry, final: boolean, mode: SelectionMode = "replace"): boolean {
    const graph_views = renderer_views.filter(is_GraphRendererView)
    let did_hit = false
    let expanded: GraphSelections | null = null

    for (const target of ["nodes", "edges"] as const) {
      const views = graph_views.filter((view) => view.model.selection_target == target)
      const glyph_views = views.map((view) => target == "nodes" ? view.node_view : view.edge_view)
      if (glyph_views.length == 0) {
        continue
      }
      const hit = this.source.selection_policy.hit_test(geometry, glyph_views)
      if (hit != null) {
        did_hit = !hit.is_empty() || did_hit
        const next = this.source.selection_policy.expand(this.source, target, hit)
        if (expanded == null) {
          expanded = next
        } else if (this.source.selection_policy.mode == "union") {
          expanded.nodes.update_through_union(next.nodes)
          expanded.edges.update_through_union(next.edges)
        } else {
          expanded.nodes.update_through_intersection(next.nodes)
          expanded.edges.update_through_intersection(next.edges)
        }
      }
    }
    if (expanded != null) {
      this._select(expanded, final, mode)
    }
    return did_hit
  }

  private _inspect_component(
    graph_view: GraphRendererView,
    target: "nodes" | "edges",
    selection: Selection,
    geometry: Geometry,
  ): void {
    const glyph_view = target == "nodes" ? graph_view.node_view : graph_view.edge_view
    const manager = glyph_view.model.data_source.selection_manager
    const inspection = manager.get_or_create_inspector(glyph_view.model)
    inspection.update(selection, true, "replace")
    glyph_view.model.data_source.setv({inspected: inspection}, {silent: true})
    glyph_view.model.data_source.inspect.emit([glyph_view.model, {geometry}])
  }

  inspect(renderer_view: DataRendererView, geometry: Geometry): boolean {
    if (!is_GraphRendererView(renderer_view)) {
      return false
    }

    const target = renderer_view.model.inspection_target
    const glyph_view = target == "nodes" ? renderer_view.node_view : renderer_view.edge_view
    const direct = glyph_view.hit_test(geometry)
    if (direct == null) {
      return false
    }

    const {nodes, edges} = this.source.selection_policy.expand(this.source, target, direct)
    this._inspect_component(renderer_view, "nodes", nodes, geometry)
    this._inspect_component(renderer_view, "edges", edges, geometry)
    return !direct.is_empty()
  }

  invert(): void {
    const node_length = this.source.nodes.get_length()
    if (node_length != null) {
      this.source.nodes.selected.invert(node_length)
      this.source.nodes._select.emit()
    }
    const edge_length = this.source.edges.get_length()
    if (edge_length != null) {
      this.source.edges.selected.invert(edge_length)
      this.source.edges._select.emit()
    }
  }

  clear(): void {
    this.source.nodes.selected.clear()
    this.source.edges.selected.clear()
    this.source.nodes._select.emit()
    this.source.edges._select.emit()
  }

  get_selection(): SelectionState {
    return {nodes: this.source.nodes.selected, edges: this.source.edges.selected}
  }

  update_selection(selection: SelectionState): void {
    if (!(selection instanceof Selection)) {
      this.source.nodes.selected.update(selection.nodes, true)
      this.source.edges.selected.update(selection.edges, true)
      this.source.nodes._select.emit()
      this.source.edges._select.emit()
    }
  }
}
