import {HasProps} from "./has_props"
import {Geometry} from "./geometry"
import {Selection} from "models/selections/selection"
import {Renderer, RendererView} from "models/renderers/renderer"
import {GlyphRendererView} from "models/renderers/glyph_renderer"
import {GraphRendererView} from "models/renderers/graph_renderer"
import * as p from "./properties"

import {ColumnarDataSource} from "models/sources/columnar_data_source"

export class SelectionManager extends HasProps {

  static initClass(): void {
    this.prototype.type = "SelectionManager"

    this.internal({
      source: [ p.Any ],
    })
  }

  source: ColumnarDataSource
  inspectors: {[key: string]: Selection}

  initialize(): void {
    super.initialize()
    this.inspectors = {}
  }

  select(renderer_views: RendererView[], geometry: Geometry, final: boolean, append: boolean = false): boolean {
    // divide renderers into glyph_renderers or graph_renderers
    const glyph_renderer_views: GlyphRendererView[] = []
    const graph_renderer_views: GraphRendererView[] = []
    for (const r of renderer_views) {
      if (r instanceof GlyphRendererView)
        glyph_renderer_views.push(r)
      else if (r instanceof GraphRendererView)
        graph_renderer_views.push(r)
    }

    let did_hit = false

    // graph renderer case
    for (const r of graph_renderer_views) {
      const hit_test_result = r.model.selection_policy.hit_test(geometry, r)
      did_hit = did_hit || r.model.selection_policy.do_selection(hit_test_result, r.model, final, append)
    }
    // glyph renderers
    if (glyph_renderer_views.length > 0) {
      const hit_test_result = this.source.selection_policy.hit_test(geometry, glyph_renderer_views)
      did_hit = did_hit || this.source.selection_policy.do_selection(hit_test_result, this.source, final, append)
    }

    return did_hit
  }

  inspect(renderer_view: RendererView, geometry: Geometry): boolean {
    let did_hit = false

    if (renderer_view instanceof GlyphRendererView) {
      const hit_test_result = renderer_view.hit_test(geometry)
      if (hit_test_result != null) {
        did_hit = !hit_test_result.is_empty()
        const inspection = this.get_or_create_inspector(renderer_view.model)
        inspection.update(hit_test_result, true, false)
        this.source.setv({inspected: inspection}, {silent: true})
        this.source.inspect.emit([renderer_view, {geometry: geometry}])
      }
    } else if (renderer_view instanceof GraphRendererView) {
      const hit_test_result = renderer_view.model.inspection_policy.hit_test(geometry, renderer_view)
      did_hit = did_hit || renderer_view.model.inspection_policy.do_inspection(hit_test_result, geometry, renderer_view, false, false)
    }

    return did_hit
  }

  clear(rview?: RendererView): void {
    this.source.selected.clear()
    if (rview != null)
      this.get_or_create_inspector(rview.model).clear()
  }

  get_or_create_inspector(rmodel: Renderer): Selection {
    if (this.inspectors[rmodel.id] == null)
      this.inspectors[rmodel.id] = new Selection()
    return this.inspectors[rmodel.id]
  }
}

SelectionManager.initClass()
