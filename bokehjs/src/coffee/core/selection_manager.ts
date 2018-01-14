import {HasProps} from "./has_props"
import {Model} from "../model"
import {Geometry} from "./geometry"
import {HitTestResult} from "./hittest"
import {Selection} from "models/selections/selection"
import {GraphRenderer} from "models/renderers/graph_renderer"
import * as p from "./properties"

import {DataSource} from "models/sources/data_source"

// XXX: temporary types
export type Renderer = any
export type RendererView = any

export abstract class SelectionPolicy extends Model {

  abstract hit_test(geometry: Geometry, renderer_views: RendererView[]): HitTestResult

  do_selection(hit_test_result: HitTestResult, renderer_views: RendererView[], final: boolean, append: boolean): boolean {
    if (hit_test_result === null) {
      return false
    } else {
      const source = renderer_views[0].model.data_source
      source.selected.update(hit_test_result, final, append)
      source._select.emit()
      return !source.selected.is_empty()
    }
  }
}

SelectionPolicy.prototype.type = "SelectionPolicy"

export class IntersectRenderers extends SelectionPolicy {

  hit_test(geometry: Geometry, renderer_views: RendererView[]): HitTestResult {
    const hit_test_result_renderers = []
    for (const r of renderer_views) {
      const result = r.hit_test(geometry)
      if (result !== null)
        hit_test_result_renderers.push(result)
    }
    if (hit_test_result_renderers.length > 0) {
      const hit_test_result = hit_test_result_renderers[0]
      for (const hit_test_result_other of hit_test_result_renderers) {
        hit_test_result.update_through_intersection(hit_test_result_other)
      }
      return hit_test_result
    } else {
      return null
    }
  }
}

IntersectRenderers.prototype.type = "IntersectRenderers"

export class UnionRenderers extends SelectionPolicy {

  hit_test(geometry: Geometry, renderer_views: RendererView[]): HitTestResult {
    const hit_test_result_renderers = []
    for (const r of renderer_views) {
      const result = r.hit_test(geometry)
      if (result !== null)
        hit_test_result_renderers.push(result)
    }
    if (hit_test_result_renderers.length > 0) {
      const hit_test_result = hit_test_result_renderers[0]
      for (const hit_test_result_other of hit_test_result_renderers) {
        hit_test_result.update_through_union(hit_test_result_other)
      }
      return hit_test_result
    } else {
      return null
    }
  }
}

UnionRenderers.prototype.type = "UnionRenderers"

export class SelectionManager extends HasProps {

  selection_policy: SelectionPolicy
  source: DataSource
  inspectors: {[key: string]: Selection}

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)
    this.inspectors = {}
  }

  select(renderer_views: RendererView[], geometry: Geometry, final: boolean, append: boolean = false): boolean {
    // divide renderers into glyph_renderers or graph_renderers
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

    let did_hit = false

    // graph renderer case
    for (const r of graph_renderer_views) {
      const hit_test_result = r.model.selection_policy.hit_test(geometry, r)
      did_hit = did_hit || r.model.selection_policy.do_selection(hit_test_result, r, final, append)
    }
    // glyph renderers
    if (glyph_renderer_views.length > 0) {
      const hit_test_result = this.selection_policy.hit_test(geometry, renderer_views)
      did_hit = did_hit || this.selection_policy.do_selection(hit_test_result, glyph_renderer_views, final, append)
    }

    return did_hit
  }

  inspect(renderer_view: RendererView, geometry: Geometry): boolean {
    let did_hit = false

    if (renderer_view.model.type == 'GlyphRenderer') {
      const hit_test_result = renderer_view.hit_test(geometry)
      did_hit =  !hit_test_result.is_empty()
      const inspection = this.get_or_create_inspector(renderer_view.model)
      inspection.update(hit_test_result, true, false)
      this.source.setv({inspected: inspection}, {silent: true})
      this.source.inspect.emit([renderer_view, {geometry: geometry}])
    } else {
      if (renderer_view.model instanceof GraphRenderer) {
        const hit_test_result = renderer_view.model.inspection_policy.hit_test(geometry, renderer_view)
        did_hit = did_hit || renderer_view.model.inspection_policy.do_inspection(hit_test_result, geometry, renderer_view, false, false)
      }
    }

    return did_hit
  }

  clear(rview: RendererView): void {
    this.source.selected.clear()
    this.get_or_create_inspector(rview.model).clear()
  }

  get_or_create_inspector(rmodel: Renderer): Selection {
    if (this.inspectors[rmodel.id] == null)
      this.inspectors[rmodel.id] = new Selection()
    return this.inspectors[rmodel.id]
  }
}

SelectionManager.prototype.type = "SelectionManager"

SelectionManager.define({
  selection_policy: [ p.Instance, () => new UnionRenderers()]
})

SelectionManager.internal({
  source: [ p.Any ]
})
