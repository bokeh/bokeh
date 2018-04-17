import {HasProps} from "./has_props"
import {Geometry} from "./geometry"
import {Selection} from "models/selections/selection"
import {GraphRenderer} from "models/renderers/graph_renderer"
import * as p from "./properties"

import {ColumnarDataSource} from "models/sources/columnar_data_source"

// XXX: temporary types
export type Renderer = any
export type RendererView = any

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

  _split_renderer_views_by_type(renderer_views: RendererView[]): {[key: string]: RendererView[]} {
    // TODO: return type, object values should be array of one type of renderer view
    const glyph_renderer_views: RendererView[] = []
    const graph_renderer_views: RendererView[] = []
    for (const r of renderer_views) {
      if (r.model.type == 'GlyphRenderer'){
        glyph_renderer_views.push(r)
      } else {
        if (r.model instanceof GraphRenderer){
          graph_renderer_views.push(r)
        }
      }
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
      const hit_test_result = this.source.selection_policy.hit_test(geometry, renderer_views)
      did_hit = did_hit || this.source.selection_policy.do_selection(hit_test_result, this.source, final, append)
    }

    return did_hit
  }

  inspect(renderer_views: RendererView[], geometry: Geometry): boolean {
    const {glyph_renderer_views, graph_renderer_views} = this._split_renderer_views_by_type(renderer_views)

    let did_hit = false

    // glyph renderers
    if (glyph_renderer_views.length > 0) {
      const hit_test_result = this.source.inspection_policy.hit_test(geometry, renderer_views)
      did_hit = did_hit || this.source.inspection_policy.do_inspection(hit_test_result, this.source)

      for (const r of glyph_renderer_views) {
        const hit_test_result = r.hit_test(geometry)
        if (hit_test_result !== null) {
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
