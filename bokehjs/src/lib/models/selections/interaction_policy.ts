import {Model} from "../../model"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type {SelectionMode} from "core/enums"
import type {GlyphRendererView} from "../renderers/glyph_renderer"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export abstract class SelectionPolicy extends Model {

  abstract hit_test(geometry: Geometry, renderer_views: GlyphRendererView[]): HitTestResult

  do_selection(hit_test_result: HitTestResult, source: ColumnarDataSource, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    } else {
      source.selected.update(hit_test_result, final, mode)
      source._select.emit()
      return !source.selected.is_empty()
    }
  }
}

export class IntersectRenderers extends SelectionPolicy {

  hit_test(geometry: Geometry, renderer_views: GlyphRendererView[]): HitTestResult {
    const hit_test_result_renderers = []
    for (const r of renderer_views) {
      const result = r.hit_test(geometry)
      if (result != null) {
        hit_test_result_renderers.push(result)
      }
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

export class UnionRenderers extends SelectionPolicy {

  hit_test(geometry: Geometry, renderer_views: GlyphRendererView[]): HitTestResult {
    const hit_test_result_renderers = []
    for (const r of renderer_views) {
      const result = r.hit_test(geometry)
      if (result != null) {
        hit_test_result_renderers.push(result)
      }
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
