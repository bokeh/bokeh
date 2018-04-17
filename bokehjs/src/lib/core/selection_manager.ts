import {HasProps} from "./has_props"
import {Geometry} from "./geometry"
import {Selection} from "models/selections/selection"
import {Renderer, RendererView} from "models/renderers/renderer"
import {GlyphRendererView} from "models/renderers/glyph_renderer"
import {GraphRendererView} from "models/renderers/graph_renderer"
import {ColumnarDataSource} from "models/sources/columnar_data_source"
import * as p from "./properties"

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

  _split_renderer_views_by_type(renderer_views: RendererView[]): {glyph_renderer_views: GlyphRendererView[], graph_renderer_views: GraphRendererView[]} {
    const glyph_renderer_views: GlyphRendererView[] = []
    const graph_renderer_views: GraphRendererView[] = []
    for (const r of renderer_views) {
      if (r instanceof GlyphRendererView)
        glyph_renderer_views.push(r)
      else if (r instanceof GraphRendererView)
        graph_renderer_views.push(r)
    }
    return {glyph_renderer_views: glyph_renderer_views, graph_renderer_views: graph_renderer_views}
  }

  select(renderer_views: RendererView[], geometry: Geometry, final: boolean, append: boolean = false): boolean {
    const {glyph_renderer_views, graph_renderer_views} = this._split_renderer_views_by_type(renderer_views)

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

  inspect(renderer_views: RendererView[], geometry: Geometry): boolean {
    const {glyph_renderer_views, graph_renderer_views} = this._split_renderer_views_by_type(renderer_views)

    let did_hit = false

    // glyph renderers
    if (glyph_renderer_views.length > 0) {
      const hit_test_result = this.source.inspection_policy.hit_test(geometry, glyph_renderer_views)
      did_hit = did_hit || this.source.inspection_policy.do_inspection(hit_test_result, this.source)

      for (const r of glyph_renderer_views) {
        const hit_test_result = r.hit_test(geometry)
        if (hit_test_result != null) {
          const inspection = this.get_or_create_inspector(r.model)
          inspection.update(hit_test_result, true, false)
          this.source.inspect.emit([r, {geometry: geometry}])
        }
      }
    }

    // graph renderers
    for (const r of graph_renderer_views) {
      const hit_test_result = r.model.inspection_policy.hit_test(geometry, r)
      did_hit = did_hit || r.model.inspection_policy.do_inspection(hit_test_result, geometry, r, false, false)
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
