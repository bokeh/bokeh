import type {Geometry} from "./geometry"
import type {SelectionMode} from "core/enums"
import {Selection} from "models/selections/selection"
import type {ColumnarDataSource} from "models/sources/columnar_data_source"
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

export class SelectionManager {
  constructor(readonly source: ColumnarDataSource) {}

  inspectors: Map<DataRenderer, Selection> = new Map()

  select(renderer_views: DataRendererView[], geometry: Geometry, final: boolean, mode: SelectionMode = "replace"): boolean {
    // divide renderers into glyph_renderers or graph_renderers
    const glyph_renderer_views: GlyphRendererView[] = []
    const graph_renderer_views: GraphRendererView[] = []
    for (const r of renderer_views) {
      if (is_GlyphRendererView(r))
        glyph_renderer_views.push(r)
      else if (is_GraphRendererView(r))
        graph_renderer_views.push(r)
    }

    let did_hit = false

    // graph renderer case
    for (const r of graph_renderer_views) {
      const hit_test_result = r.model.selection_policy.hit_test(geometry, r)
      did_hit = did_hit || r.model.selection_policy.do_selection(hit_test_result, r.model, final, mode)
    }
    // glyph renderers
    if (glyph_renderer_views.length > 0) {
      const hit_test_result = this.source.selection_policy.hit_test(geometry, glyph_renderer_views)
      did_hit = did_hit || this.source.selection_policy.do_selection(hit_test_result, this.source, final, mode)
    }

    return did_hit
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
    } else if (is_GraphRendererView(renderer_view)) {
      const hit_test_result = renderer_view.model.inspection_policy.hit_test(geometry, renderer_view)
      did_hit = renderer_view.model.inspection_policy.do_inspection(hit_test_result, geometry, renderer_view, false, "replace")
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

  get_or_create_inspector(renderer: DataRenderer): Selection {
    let selection = this.inspectors.get(renderer)
    if (selection == null) {
      selection = new Selection()
      this.inspectors.set(renderer, selection)
    }
    return selection
  }
}
