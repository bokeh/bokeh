import type {Geometry} from "./geometry"
import type {SelectionMode} from "core/enums"
import {Selection} from "models/selections/selection"
import type {ColumnarDataSource} from "models/sources/columnar_data_source"
import type {DataRenderer, DataRendererView} from "models/renderers/data_renderer"
import type {GlyphRendererView} from "models/renderers/glyph_renderer"
import type {GraphRendererView} from "models/renderers/graph_renderer"
import {logger} from "core/logging"

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

  select(renderer_views: DataRendererView[], geometry: Geometry, final: boolean = true, mode: SelectionMode = "replace"): boolean {
    const glyph_renderer_views: GlyphRendererView[] = []
    const graph_renderer_views: GraphRendererView[] = []

    for (const rv of renderer_views) {
      if (is_GlyphRendererView(rv)) {
        glyph_renderer_views.push(rv)
      } else if (is_GraphRendererView(rv)) {
        graph_renderer_views.push(rv)
      } else {
        logger.warn(`selection of ${rv.model} is not supported`)
      }
    }

    let did_hit = false

    if (glyph_renderer_views.length > 0) {
      const {selection_policy} = this.source
      const hit_test_result = selection_policy.hit_test(geometry, glyph_renderer_views)
      did_hit ||= selection_policy.do_selection(hit_test_result, this.source, final, mode)
    }

    for (const rv of graph_renderer_views) {
      const {selection_policy} = rv.model
      const hit_test_result = selection_policy.hit_test(geometry, rv)
      did_hit ||= selection_policy.do_selection(hit_test_result, rv.model, final, mode)
    }

    return did_hit
  }

  inspect(renderer_views: DataRendererView[], geometry: Geometry, final: boolean = true, mode: SelectionMode = "replace"): boolean {
    const glyph_renderer_views: GlyphRendererView[] = []
    const graph_renderer_views: GraphRendererView[] = []

    for (const rv of renderer_views) {
      if (is_GlyphRendererView(rv)) {
        glyph_renderer_views.push(rv)
      } else if (is_GraphRendererView(rv)) {
        graph_renderer_views.push(rv)
      } else {
        logger.warn(`inspection of ${rv.model} is not supported`)
      }
    }

    let did_hit = false

    if (glyph_renderer_views.length > 0) {
      const {inspection_policy} = this.source
      const hit_test_result = inspection_policy.hit_test(geometry, glyph_renderer_views)
      did_hit ||= inspection_policy.do_inspection(hit_test_result, this.source, final, mode, glyph_renderer_views, geometry)
    }

    for (const rv of graph_renderer_views) {
      const {inspection_policy} = rv.model
      const hit_test_result = inspection_policy.hit_test(geometry, rv)
      did_hit ||= inspection_policy.do_inspection(hit_test_result, geometry, rv, final, mode)
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
